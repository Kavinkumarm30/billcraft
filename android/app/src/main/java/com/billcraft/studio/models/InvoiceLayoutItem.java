package com.billcraft.studio.models;

import java.io.Serializable;

public class InvoiceLayoutItem implements Serializable {
    private String id;
    private String name;
    private String badge;
    private String desc;
    private boolean isCustom;

    public InvoiceLayoutItem(String id, String name, String badge, String desc, boolean isCustom) {
        this.id = id;
        this.name = name;
        this.badge = badge;
        this.desc = desc;
        this.isCustom = isCustom;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getBadge() { return badge; }
    public String getDesc() { return desc; }
    public boolean isCustom() { return isCustom; }
}
