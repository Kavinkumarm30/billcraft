package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class InvoiceItem implements Serializable {
    @SerializedName("id")
    private Integer id;

    @SerializedName("description")
    private String description;

    @SerializedName("quantity")
    private String quantity = "1";

    @SerializedName("unit")
    private String unit = "pcs";

    @SerializedName("rate")
    private String rate = "0";

    @SerializedName("amount")
    private String amount = "0";

    public InvoiceItem() {}

    public InvoiceItem(String description, String quantity, String rate, String amount) {
        this.description = description;
        this.quantity = quantity;
        this.rate = rate;
        this.amount = amount;
    }

    public Integer getId() { return id; }
    public String getDescription() { return description != null ? description : ""; }
    public void setDescription(String description) { this.description = description; }

    public String getQuantity() { return quantity != null ? quantity : "1"; }
    public void setQuantity(String quantity) { this.quantity = quantity; }

    public String getUnit() { return unit != null ? unit : "pcs"; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getRate() { return rate != null ? rate : "0"; }
    public void setRate(String rate) { this.rate = rate; }

    public String getAmount() { return amount != null ? amount : "0"; }
    public void setAmount(String amount) { this.amount = amount; }
}
