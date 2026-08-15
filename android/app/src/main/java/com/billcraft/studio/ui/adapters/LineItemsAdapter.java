package com.billcraft.studio.ui.adapters;

import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.models.InvoiceItem;

import java.util.ArrayList;
import java.util.List;

public class LineItemsAdapter extends RecyclerView.Adapter<LineItemsAdapter.ViewHolder> {

    private List<InvoiceItem> items = new ArrayList<>();
    private Runnable onCalculationChanged;

    public LineItemsAdapter(Runnable onCalculationChanged) {
        this.onCalculationChanged = onCalculationChanged;
    }

    public void setItems(List<InvoiceItem> items) {
        this.items = items != null ? items : new ArrayList<>();
        notifyDataSetChanged();
    }

    public List<InvoiceItem> getItems() {
        return items;
    }

    public void addItem() {
        items.add(new InvoiceItem("New Item", "1", "0", "0"));
        notifyItemInserted(items.size() - 1);
        if (onCalculationChanged != null) onCalculationChanged.run();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_line_item_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        InvoiceItem item = items.get(position);

        holder.etDesc.setText(item.getDescription());
        holder.etQty.setText(item.getQuantity());
        holder.etRate.setText(item.getRate());
        holder.tvAmount.setText("₹" + item.getAmount());

        TextWatcher watcher = new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                item.setDescription(holder.etDesc.getText().toString());
                item.setQuantity(holder.etQty.getText().toString());
                item.setRate(holder.etRate.getText().toString());

                double q = 0, r = 0;
                try { q = Double.parseDouble(item.getQuantity()); } catch (Exception ignored) {}
                try { r = Double.parseDouble(item.getRate()); } catch (Exception ignored) {}
                double amount = q * r;
                item.setAmount(String.format("%.2f", amount));
                holder.tvAmount.setText("₹" + item.getAmount());

                if (onCalculationChanged != null) onCalculationChanged.run();
            }
        };

        holder.etQty.addTextChangedListener(watcher);
        holder.etRate.addTextChangedListener(watcher);
        holder.etDesc.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                item.setDescription(s.toString());
            }
        });

        holder.btnRemove.setOnClickListener(v -> {
            int pos = holder.getAdapterPosition();
            if (pos >= 0 && pos < items.size()) {
                items.remove(pos);
                notifyItemRemoved(pos);
                notifyItemRangeChanged(pos, items.size());
                if (onCalculationChanged != null) onCalculationChanged.run();
            }
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        EditText etDesc, etQty, etRate;
        TextView tvAmount;
        ImageView btnRemove;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            etDesc = itemView.findViewById(R.id.etDescription);
            etQty = itemView.findViewById(R.id.etQty);
            etRate = itemView.findViewById(R.id.etRate);
            tvAmount = itemView.findViewById(R.id.tvAmount);
            btnRemove = itemView.findViewById(R.id.btnRemoveItem);
        }
    }
}
