package com.billcraft.studio.ui.adapters;

import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.ui.InvoicePreviewActivity;

import java.util.ArrayList;
import java.util.List;

public class InvoicesAdapter extends RecyclerView.Adapter<InvoicesAdapter.ViewHolder> {

    private List<Invoice> invoices = new ArrayList<>();

    public void setInvoices(List<Invoice> invoices) {
        this.invoices = invoices != null ? invoices : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_invoice_history_card, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Invoice inv = invoices.get(position);
        holder.tvInvoiceNumber.setText(inv.getInvoiceNumber());
        holder.tvGrandTotal.setText("₹" + inv.getGrandTotal());
        holder.tvCustomerName.setText(inv.getCustomerName());
        holder.tvDate.setText(inv.getDate() != null ? inv.getDate() : "");
        holder.tvStatus.setText(inv.getStatus());

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(holder.itemView.getContext(), InvoicePreviewActivity.class);
            intent.putExtra("invoice", inv);
            holder.itemView.getContext().startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return invoices.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvInvoiceNumber, tvGrandTotal, tvCustomerName, tvDate, tvStatus;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvInvoiceNumber = itemView.findViewById(R.id.tvInvoiceNumber);
            tvGrandTotal = itemView.findViewById(R.id.tvInvoiceGrandTotal);
            tvCustomerName = itemView.findViewById(R.id.tvCustomerName);
            tvDate = itemView.findViewById(R.id.tvInvoiceDate);
            tvStatus = itemView.findViewById(R.id.tvStatusBadge);
        }
    }
}
