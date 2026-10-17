package com.freshfold.order;

import com.freshfold.auth.AuthUser;
import com.freshfold.order.OrderDtos.CreateOrderRequest;
import com.freshfold.order.OrderDtos.CreateDeliveryAgentRequest;
import com.freshfold.order.OrderDtos.DeliveryAgentAdminResponse;
import com.freshfold.order.OrderDtos.OrderResponse;
import com.freshfold.order.OrderDtos.OrderStage;
import com.freshfold.order.OrderDtos.PaymentStatus;
import com.freshfold.order.OrderDtos.ServiceAreaResponse;
import com.freshfold.order.OrderDtos.ServiceResponse;
import com.freshfold.order.OrderDtos.SlotResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {
    private final JdbcTemplate jdbc;

    public OrderService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ServiceResponse> findServices() {
        return jdbc.query("select id, name, unit, price from services where active = true order by id",
                (row, number) -> new ServiceResponse(row.getLong("id"), row.getString("name"), row.getString("unit"), row.getBigDecimal("price")));
    }

    public List<ServiceAreaResponse> findServiceAreas() {
        return jdbc.query("select pincode, area_name, latitude, longitude from service_areas where active = true order by area_name",
                (row, number) -> new ServiceAreaResponse(row.getString("pincode"), row.getString("area_name"),
                        row.getBigDecimal("latitude"), row.getBigDecimal("longitude")));
    }

    public List<SlotResponse> findSlots(String pincode) {
        Integer covered = jdbc.queryForObject("select count(*) from service_areas where pincode = ? and active = true", Integer.class, pincode);
        if (covered == null || covered == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "We do not serve this pincode yet.");
        }
        return jdbc.query("select id, label from pickup_slots where active = true and booked_count < capacity order by starts_at",
                (row, number) -> new SlotResponse(row.getLong("id"), row.getString("label")));
    }

    @Transactional
    public OrderResponse create(AuthUser user, CreateOrderRequest request) {
        findSlots(request.pincode());
        var items = request.items().stream().map(item -> {
            var service = jdbc.query("select id, price from services where id = ? and active = true", (row, number) ->
                    new ServicePrice(row.getLong("id"), row.getBigDecimal("price")), item.serviceId()).stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected service is unavailable."));
            return new PricedItem(service.id(), item.quantity(), service.price(), service.price().multiply(item.quantity()));
        }).toList();
        Integer changed = jdbc.update("update pickup_slots set booked_count = booked_count + 1 where id = ? and active = true and booked_count < capacity", request.pickupSlotId());
        if (changed == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected pickup slot is full.");

        String orderNumber = "FF-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
        BigDecimal total = items.stream().map(PricedItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        Long agentId = findAvailableAgent();
        OrderStatus initialStatus = agentId == null ? OrderStatus.BOOKED : OrderStatus.PICKUP_ASSIGNED;
        jdbc.update("""
                insert into orders(order_number, user_id, status, address_text, pincode, pickup_latitude, pickup_longitude, pickup_slot_id,
                    delivery_agent_id, estimated_total, estimated_delivery_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, orderNumber, user.id(), initialStatus.name(), request.address().trim(), request.pincode(),
                request.latitude(), request.longitude(), request.pickupSlotId(), agentId, total, LocalDateTime.now().plusDays(3));
        Long orderId = jdbc.queryForObject("select id from orders where order_number = ?", Long.class, orderNumber);
        items.forEach(item -> jdbc.update("insert into order_items(order_id, service_id, quantity, unit_price, line_total) values (?, ?, ?, ?, ?)",
                orderId, item.serviceId(), item.quantity(), item.unitPrice(), item.lineTotal()));
        addHistory(orderId, OrderStatus.BOOKED, "Booking confirmed. Pickup request received.");
        if (agentId != null) addHistory(orderId, OrderStatus.PICKUP_ASSIGNED, "Delivery partner assigned for doorstep pickup.");
        return findInternal(orderNumber);
    }

    public OrderResponse findForCustomer(AuthUser user, String orderNumber) {
        Integer owned = jdbc.queryForObject("select count(*) from orders where order_number = ? and user_id = ?", Integer.class, orderNumber, user.id());
        if (owned == null || owned == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found in your account.");
        return findInternal(orderNumber);
    }

    public List<OrderResponse> findAll() {
        return jdbc.queryForList("select order_number from orders order by created_at desc limit 100", String.class)
                .stream().map(this::findInternal).toList();
    }

    public List<OrderResponse> findMine(Long userId) {
        return jdbc.queryForList("select order_number from orders where user_id = ? order by created_at desc", String.class, userId)
                .stream().map(this::findInternal).toList();
    }

    @Transactional
    public OrderResponse updateStatus(String orderNumber, OrderStatus status) {
        OrderResponse existing = findInternal(orderNumber);
        validateTransition(existing.status(), status);
        jdbc.update("update orders set status = ?, updated_at = current_timestamp where order_number = ?", status.name(), orderNumber);
        Long orderId = jdbc.queryForObject("select id from orders where order_number = ?", Long.class, orderNumber);
        addHistory(orderId, status, noteFor(status));
        return findInternal(existing.orderNumber());
    }

    @Transactional
    public OrderResponse updateStage(String orderNumber, OrderStage stage) {
        OrderResponse existing = findInternal(orderNumber);
        if (existing.status() == OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled orders cannot be updated.");
        }
        OrderStage current = stageFor(existing.status());
        if (stage.ordinal() != current.ordinal() + 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must move from incoming to processing, then completed.");
        }
        OrderStatus target = switch (stage) {
            case PROCESSING -> OrderStatus.CLEANING;
            case COMPLETED -> OrderStatus.READY_FOR_DELIVERY;
            case DELIVERED -> OrderStatus.DELIVERED;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid next stage.");
        };
        List<OrderStatus> flow = statusFlow();
        Long orderId = jdbc.queryForObject("select id from orders where order_number = ?", Long.class, orderNumber);
        for (int index = flow.indexOf(existing.status()) + 1; index <= flow.indexOf(target); index++) {
            OrderStatus next = flow.get(index);
            jdbc.update("update orders set status = ?, updated_at = current_timestamp where id = ?", next.name(), orderId);
            addHistory(orderId, next, noteFor(next));
        }
        return findInternal(orderNumber);
    }

    @Transactional
    public OrderResponse updatePayment(String orderNumber, PaymentStatus paymentStatus) {
        findInternal(orderNumber);
        jdbc.update("update orders set payment_status = ?, updated_at = current_timestamp where order_number = ?",
                paymentStatus.name(), orderNumber);
        return findInternal(orderNumber);
    }

    public List<DeliveryAgentAdminResponse> findDeliveryAgents() {
        return jdbc.query("select id, name, phone, vehicle_number, active from delivery_agents where active = true order by created_at desc",
                (row, number) -> new DeliveryAgentAdminResponse(row.getLong("id"), row.getString("name"),
                        row.getString("phone"), row.getString("vehicle_number"), row.getBoolean("active")));
    }

    @Transactional
    public DeliveryAgentAdminResponse createDeliveryAgent(CreateDeliveryAgentRequest request) {
        Long id = jdbc.queryForObject("insert into delivery_agents(name, phone, vehicle_number) values (?, ?, ?) returning id",
                Long.class, request.name().trim(), request.phone().trim(), request.vehicleNumber().trim().toUpperCase(Locale.ROOT));
        return jdbc.queryForObject("select id, name, phone, vehicle_number, active from delivery_agents where id = ?",
                (row, number) -> new DeliveryAgentAdminResponse(row.getLong("id"), row.getString("name"),
                        row.getString("phone"), row.getString("vehicle_number"), row.getBoolean("active")), id);
    }

    @Transactional
    public DeliveryAgentAdminResponse updateDeliveryAgent(Long id, CreateDeliveryAgentRequest request) {
        int changed = jdbc.update("update delivery_agents set name = ?, phone = ?, vehicle_number = ? where id = ? and active = true",
                request.name().trim(), request.phone().trim(), request.vehicleNumber().trim().toUpperCase(Locale.ROOT), id);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery boy not found.");
        return jdbc.queryForObject("select id, name, phone, vehicle_number, active from delivery_agents where id = ?",
                (row, number) -> new DeliveryAgentAdminResponse(row.getLong("id"), row.getString("name"),
                        row.getString("phone"), row.getString("vehicle_number"), row.getBoolean("active")), id);
    }

    public void deleteDeliveryAgent(Long id) {
        int changed = jdbc.update("update delivery_agents set active = false where id = ? and active = true", id);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery boy not found.");
    }

    private OrderResponse findInternal(String orderNumber) {
        return jdbc.query("""
                select o.id, o.order_number, o.status, o.address_text, o.pincode, o.pickup_latitude, o.pickup_longitude, o.estimated_total,
                    o.payment_status, o.estimated_delivery_at, o.created_at, ps.label pickup_slot,
                    u.name customer_name, u.email customer_email,
                    da.name agent_name, da.phone agent_phone, da.vehicle_number
                from orders o join pickup_slots ps on ps.id = o.pickup_slot_id
                left join users u on u.id = o.user_id
                left join delivery_agents da on da.id = o.delivery_agent_id
                where o.order_number = ?
                """, (row, number) -> {
            long orderId = row.getLong("id");
            var customer = row.getString("customer_name") == null
                    ? new OrderDtos.CustomerResponse("Legacy customer", "Account not linked")
                    : new OrderDtos.CustomerResponse(row.getString("customer_name"), row.getString("customer_email"));
            var agent = row.getString("agent_name") == null ? null : new OrderDtos.DeliveryAgentResponse(
                    row.getString("agent_name"), row.getString("agent_phone"), row.getString("vehicle_number"));
            var items = jdbc.query("""
                    select s.name, oi.quantity, s.unit, oi.unit_price from order_items oi
                    join services s on s.id = oi.service_id where oi.order_id = ? order by oi.id
                    """, (item, index) -> new OrderDtos.OrderItemResponse(item.getString("name"),
                    item.getBigDecimal("quantity"), item.getString("unit"), item.getBigDecimal("unit_price")), orderId);
            var history = jdbc.query("select status, note, created_at from order_status_history where order_id = ? order by created_at, id",
                    (event, index) -> new OrderDtos.StatusEventResponse(OrderStatus.valueOf(event.getString("status")),
                            event.getString("note"), event.getObject("created_at", LocalDateTime.class)), orderId);
            return new OrderResponse(row.getString("order_number"), OrderStatus.valueOf(row.getString("status")),
                    row.getString("address_text"), row.getString("pincode"), row.getBigDecimal("pickup_latitude"),
                    row.getBigDecimal("pickup_longitude"), row.getBigDecimal("estimated_total"),
                    PaymentStatus.valueOf(row.getString("payment_status")),
                    row.getString("pickup_slot"), row.getObject("estimated_delivery_at", LocalDateTime.class),
                    row.getObject("created_at", LocalDateTime.class), customer, agent, items, history);
        }, orderNumber).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
    }

    private Long findAvailableAgent() {
        return jdbc.query("""
                select da.id from delivery_agents da left join orders o on o.delivery_agent_id = da.id
                    and o.status not in ('DELIVERED','CANCELLED')
                where da.active = true group by da.id order by count(o.id), da.id limit 1
                """, (row, number) -> row.getLong("id")).stream().findFirst().orElse(null);
    }

    private void addHistory(Long orderId, OrderStatus status, String note) {
        jdbc.update("insert into order_status_history(order_id, status, note) values (?, ?, ?)", orderId, status.name(), note);
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == next) return;
        if (next == OrderStatus.CANCELLED && !Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED).contains(current)) return;
        List<OrderStatus> flow = statusFlow();
        if (flow.indexOf(next) != flow.indexOf(current) + 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status must follow the pickup and delivery sequence.");
        }
    }

    private List<OrderStatus> statusFlow() {
        return List.of(OrderStatus.BOOKED, OrderStatus.PICKUP_ASSIGNED, OrderStatus.OUT_FOR_PICKUP,
                OrderStatus.PICKED_UP, OrderStatus.AT_SHOP, OrderStatus.CLEANING, OrderStatus.READY_FOR_DELIVERY,
                OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
    }

    private OrderStage stageFor(OrderStatus status) {
        if (status == OrderStatus.DELIVERED) return OrderStage.DELIVERED;
        if (Set.of(OrderStatus.READY_FOR_DELIVERY, OrderStatus.OUT_FOR_DELIVERY).contains(status)) return OrderStage.COMPLETED;
        if (Set.of(OrderStatus.PICKED_UP, OrderStatus.AT_SHOP, OrderStatus.CLEANING).contains(status)) return OrderStage.PROCESSING;
        return OrderStage.INCOMING;
    }

    private String noteFor(OrderStatus status) {
        return switch (status) {
            case BOOKED -> "Booking confirmed. Pickup request received.";
            case PICKUP_ASSIGNED -> "Delivery partner assigned for doorstep pickup.";
            case OUT_FOR_PICKUP -> "Delivery partner is on the way to collect your clothes.";
            case PICKED_UP -> "Clothes collected from your address.";
            case AT_SHOP -> "Clothes received and checked at the FreshFold shop.";
            case CLEANING -> "Professional cleaning is in progress.";
            case READY_FOR_DELIVERY -> "Cleaning completed and clothes packed for return.";
            case OUT_FOR_DELIVERY -> "Fresh clothes are on the way to your doorstep.";
            case DELIVERED -> "Order delivered successfully.";
            case CANCELLED -> "Order cancelled.";
        };
    }

    private record ServicePrice(Long id, BigDecimal price) {}
    private record PricedItem(Long serviceId, BigDecimal quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}
}
