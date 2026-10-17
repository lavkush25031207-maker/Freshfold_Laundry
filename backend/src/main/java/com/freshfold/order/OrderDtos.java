package com.freshfold.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record CreateOrderRequest(
            @NotEmpty List<@Valid OrderItemRequest> items,
            @NotBlank @Pattern(regexp = "\\d{6}") String pincode,
            @NotBlank @Size(min = 10, max = 500) String address,
            @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
            @NotNull Long pickupSlotId) {}

    public record OrderItemRequest(
            @NotNull Long serviceId,
            @NotNull @Min(1) @Max(50) BigDecimal quantity) {}

    public record UpdateStatusRequest(@NotNull OrderStatus status) {}
    public record UpdateStageRequest(@NotNull OrderStage stage) {}

    public enum OrderStage { INCOMING, PROCESSING, COMPLETED, DELIVERED }
    public enum PaymentStatus { PENDING, PAID }
    public record UpdatePaymentRequest(@NotNull PaymentStatus paymentStatus) {}

    public record OrderResponse(
            String orderNumber,
            OrderStatus status,
            String address,
            String pincode,
            BigDecimal latitude,
            BigDecimal longitude,
            BigDecimal totalAmount,
            PaymentStatus paymentStatus,
            String pickupSlot,
            LocalDateTime estimatedDeliveryAt,
            LocalDateTime createdAt,
            CustomerResponse customer,
            DeliveryAgentResponse deliveryAgent,
            List<OrderItemResponse> items,
            List<StatusEventResponse> history) {}

    public record CustomerResponse(String name, String email) {}
    public record DeliveryAgentResponse(String name, String phone, String vehicleNumber) {}
    public record DeliveryAgentAdminResponse(Long id, String name, String phone, String vehicleNumber, boolean active) {}
    public record CreateDeliveryAgentRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Pattern(regexp = "^[+0-9][0-9 ]{9,19}$") String phone,
            @NotBlank @Size(max = 30) String vehicleNumber) {}
    public record OrderItemResponse(String serviceName, BigDecimal quantity, String unit, BigDecimal unitPrice) {}
    public record StatusEventResponse(OrderStatus status, String note, LocalDateTime createdAt) {}

    public record ServiceResponse(Long id, String name, String unit, BigDecimal price) {}
    public record ServiceAreaResponse(String pincode, String areaName, BigDecimal latitude, BigDecimal longitude) {}
    public record SlotResponse(Long id, String label) {}
}
