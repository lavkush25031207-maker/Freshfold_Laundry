package com.freshfold.order;

import com.freshfold.auth.AuthUser;
import com.freshfold.order.OrderDtos.CreateOrderRequest;
import com.freshfold.order.OrderDtos.CreateDeliveryAgentRequest;
import com.freshfold.order.OrderDtos.DeliveryAgentAdminResponse;
import com.freshfold.order.OrderDtos.OrderResponse;
import com.freshfold.order.OrderDtos.ServiceResponse;
import com.freshfold.order.OrderDtos.ServiceAreaResponse;
import com.freshfold.order.OrderDtos.SlotResponse;
import com.freshfold.order.OrderDtos.UpdateStatusRequest;
import com.freshfold.order.OrderDtos.UpdateStageRequest;
import com.freshfold.order.OrderDtos.UpdatePaymentRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping("/services")
    List<ServiceResponse> services() { return orders.findServices(); }

    @GetMapping("/service-areas")
    List<ServiceAreaResponse> serviceAreas() { return orders.findServiceAreas(); }

    @GetMapping("/slots")
    List<SlotResponse> slots(@RequestParam @Pattern(regexp = "\\d{6}") String pincode) { return orders.findSlots(pincode); }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    OrderResponse create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody CreateOrderRequest request) {
        return orders.create(user, request);
    }

    @GetMapping("/orders/{orderNumber}")
    OrderResponse find(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
        return orders.findForCustomer(user, orderNumber);
    }

    @GetMapping("/orders/mine")
    List<OrderResponse> mine(@AuthenticationPrincipal AuthUser user) { return orders.findMine(user.id()); }

    @GetMapping("/admin/orders")
    List<OrderResponse> all() { return orders.findAll(); }

    @PatchMapping("/admin/orders/{orderNumber}/status")
    OrderResponse update(@PathVariable String orderNumber, @Valid @RequestBody UpdateStatusRequest request) {
        return orders.updateStatus(orderNumber, request.status());
    }

    @PatchMapping("/admin/orders/{orderNumber}/stage")
    OrderResponse updateStage(@PathVariable String orderNumber, @Valid @RequestBody UpdateStageRequest request) {
        return orders.updateStage(orderNumber, request.stage());
    }

    @PatchMapping("/admin/orders/{orderNumber}/payment")
    OrderResponse updatePayment(@PathVariable String orderNumber, @Valid @RequestBody UpdatePaymentRequest request) {
        return orders.updatePayment(orderNumber, request.paymentStatus());
    }

    @GetMapping("/admin/delivery-agents")
    List<DeliveryAgentAdminResponse> deliveryAgents() { return orders.findDeliveryAgents(); }

    @PostMapping("/admin/delivery-agents")
    @ResponseStatus(HttpStatus.CREATED)
    DeliveryAgentAdminResponse createDeliveryAgent(@Valid @RequestBody CreateDeliveryAgentRequest request) {
        return orders.createDeliveryAgent(request);
    }

    @PatchMapping("/admin/delivery-agents/{id}")
    DeliveryAgentAdminResponse updateDeliveryAgent(@PathVariable Long id, @Valid @RequestBody CreateDeliveryAgentRequest request) {
        return orders.updateDeliveryAgent(id, request);
    }

    @DeleteMapping("/admin/delivery-agents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteDeliveryAgent(@PathVariable Long id) { orders.deleteDeliveryAgent(id); }
}
