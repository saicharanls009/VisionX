from io import BytesIO

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def crop_chart_png(rows: list[dict[str, object]]) -> bytes:
    figure, axis = plt.subplots(figsize=(8, 4.5))
    crops = [str(row["crop"]) for row in rows]
    quantities = [float(row["quantity_quintals"]) for row in rows]
    if crops:
        axis.bar(crops, quantities, color="#1d4ed8")
        axis.set_ylabel("Quantity (quintals)")
        axis.set_title("Completed Procurement by Crop")
        axis.tick_params(axis="x", rotation=25)
    else:
        axis.text(0.5, 0.5, "No completed procurement data", ha="center", va="center")
        axis.set_axis_off()
    figure.tight_layout()
    output = BytesIO()
    figure.savefig(output, format="png", dpi=150)
    plt.close(figure)
    return output.getvalue()
