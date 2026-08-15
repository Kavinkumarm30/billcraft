package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class Invoice implements Serializable {
    @SerializedName("id")
    private Integer id;

    @SerializedName("invoiceNumber")
    private String invoiceNumber;

    @SerializedName("date")
    private String date;

    @SerializedName("subtotal")
    private String subtotal = "0";

    @SerializedName("discount")
    private String discount = "0";

    @SerializedName("taxAmount")
    private String taxAmount = "0";

    @SerializedName("grandTotal")
    private String grandTotal = "0";

    @SerializedName("notes")
    private String notes;

    @SerializedName("status")
    private String status = "PENDING";

    @SerializedName("paymentMethod")
    private String paymentMethod;

    @SerializedName("paymentReference")
    private String paymentReference;

    @SerializedName("customer")
    private Customer customer;

    @SerializedName("customerName")
    private String customerName;

    @SerializedName("phone")
    private String phone;

    @SerializedName("address")
    private String address;

    @SerializedName("items")
    private List<InvoiceItem> items = new ArrayList<>();

    @SerializedName("createdAt")
    private String createdAt;

    // Getters and Setters
    public Integer getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber != null ? invoiceNumber : "INV-000000"; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getSubtotal() { return subtotal != null ? subtotal : "0"; }
    public void setSubtotal(String subtotal) { this.subtotal = subtotal; }

    public String getDiscount() { return discount != null ? discount : "0"; }
    public void setDiscount(String discount) { this.discount = discount; }

    public String getTaxAmount() { return taxAmount != null ? taxAmount : "0"; }
    public void setTaxAmount(String taxAmount) { this.taxAmount = taxAmount; }

    public String getGrandTotal() { return grandTotal != null ? grandTotal : "0"; }
    public void setGrandTotal(String grandTotal) { this.grandTotal = grandTotal; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status != null ? status : "PENDING"; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getCustomerName() {
        if (customer != null && customer.getName() != null) return customer.getName();
        return customerName != null ? customerName : "";
    }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() {
        if (customer != null && customer.getPhone() != null) return customer.getPhone();
        return phone != null ? phone : "";
    }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() {
        if (customer != null && customer.getAddress() != null) return customer.getAddress();
        return address != null ? address : "";
    }
    public void setAddress(String address) { this.address = address; }

    public List<InvoiceItem> getItems() { return items != null ? items : new ArrayList<>(); }
    public void setItems(List<InvoiceItem> items) { this.items = items; }

    public String getCreatedAt() { return createdAt; }
}
