package com.billcraft.studio.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.models.Customer;

import java.util.ArrayList;
import java.util.List;

public class CustomersAdapter extends RecyclerView.Adapter<CustomersAdapter.ViewHolder> {

    private List<Customer> customers = new ArrayList<>();

    public void setCustomers(List<Customer> customers) {
        this.customers = customers != null ? customers : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_customer_card, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Customer c = customers.get(position);
        holder.tvCustName.setText(c.getName());
        holder.tvCustPhone.setText(c.getPhone() != null && !c.getPhone().isEmpty() ? c.getPhone() : "No phone number");
        holder.tvCustAddress.setText(c.getAddress() != null && !c.getAddress().isEmpty() ? c.getAddress() : "No address recorded");
    }

    @Override
    public int getItemCount() {
        return customers.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvCustName, tvCustPhone, tvCustAddress;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvCustName = itemView.findViewById(R.id.tvCustName);
            tvCustPhone = itemView.findViewById(R.id.tvCustPhone);
            tvCustAddress = itemView.findViewById(R.id.tvCustAddress);
        }
    }
}
