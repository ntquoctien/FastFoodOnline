import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

const Inventory = ({ url }) => {
  const { token } = useContext(StoreContext);
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);

  const fetchInventory = async (selectedBranch) => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/inventory`, {
        headers: { token },
        params: selectedBranch ? { branchId: selectedBranch } : {},
      });
      if (response.data.success) {
        setItems(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Inventory fetch failed", error);
      toast.error("Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory(branchFilter);
    }
  }, [token, branchFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchParam = params.get("branch") || "";
    setBranchFilter((prev) =>
      prev === branchParam ? prev : branchParam
    );
  }, [location.search]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${url}/api/v2/branches`, { headers: { token } })
      .then((response) => {
        if (response.data?.success) {
          setBranchOptions(response.data.data?.branches || []);
        }
      })
      .catch((error) => {
        console.warn("Failed to load branch options for inventory", error);
      });
  }, [token, url]);

  const normalizedItems = useMemo(() => {
    return (items || []).map((entry) => {
      const food = entry.foodVariantId?.foodId || {};
      const branch = entry.branchId || {};
      return {
        id: entry._id,
        raw: entry,
        foodId:
          food._id ||
          entry.foodVariantId?.foodId ||
          entry.foodVariantId?._id,
        foodName: food.name || "Unnamed dish",
        categoryName: food.categoryId?.name || "",
        branchId: String(branch._id || ""),
        branchName: branch.name || "Unknown branch",
        size: entry.foodVariantId?.size || "N/A",
        quantity: entry.quantity ?? 0,
        updatedAt: entry.updatedAt || entry.createdAt,
        variantId: entry.foodVariantId?._id,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return normalizedItems;
    return normalizedItems.filter(
      (entry) =>
        entry.foodName.toLowerCase().includes(query) ||
        entry.branchName.toLowerCase().includes(query) ||
        entry.size.toLowerCase().includes(query)
    );
  }, [normalizedItems, searchTerm]);

  const groupedInventory = useMemo(() => {
    const map = new Map();
    const groups = [];
    filteredItems.forEach((entry) => {
      const key = entry.foodId || entry.variantId || entry.id;
      if (!map.has(key)) {
        map.set(key, {
          foodId: key,
          foodName: entry.foodName,
          categoryName: entry.categoryName,
          variants: [],
        });
        groups.push(map.get(key));
      }
      map.get(key).variants.push(entry);
    });
    return groups;
  }, [filteredItems]);

  const handleUpdate = async (entry) => {
    const currentQuantity = entry.quantity ?? 0;
    const next = window.prompt(
      `Set quantity for ${
        entry.foodVariantId?.foodId?.name || "item"
      } (${entry.foodVariantId?.size})`,
      currentQuantity
    );
    if (next === null) return;
    const parsed = Number(next);
    if (Number.isNaN(parsed)) {
      toast.error("Quantity must be a number");
      return;
    }
    try {
      const payload = {
        branchId: entry.branchId?._id,
        foodVariantId: entry.foodVariantId?._id,
        quantity: parsed,
      };
      const response = await axios.post(`${url}/api/v2/inventory`, payload, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Inventory updated");
        fetchInventory(branchFilter);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to update inventory");
    }
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Inventory</h3>
          <p className="text-muted mb-0">
            Monitor stock levels by branch and variant.
          </p>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2 w-100 w-lg-auto">
          <input
            type="search"
            className="form-control"
            placeholder="Search dishes or branches"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="form-select"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="">All branches</option>
            {branchOptions.map((branch) => (
              <option key={String(branch._id)} value={String(branch._id)}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card border rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading inventory...</p>
          </div>
        </div>
      ) : groupedInventory.length === 0 ? (
        <div className="card border rounded-4">
          <div className="card-body text-center py-5 text-muted">
            No inventory entries match the current filters.
          </div>
        </div>
      ) : (
        groupedInventory.map((group) => (
          <div key={group.foodId} className="card border rounded-4 mb-4">
            <div className="card-header border-0 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                <h5 className="mb-0">{group.foodName}</h5>
                {group.categoryName && (
                  <span className="badge bg-primary-subtle text-primary">
                    {group.categoryName}
                  </span>
                )}
              </div>
              <small className="text-muted">
                {group.variants.length} {group.variants.length === 1 ? "variant" : "variants"}
              </small>
            </div>
            <div className="card-body pt-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="text-muted small text-uppercase">
                    <tr>
                      <th>Branch</th>
                      <th>Size</th>
                      <th>Quantity</th>
                      <th>Updated</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td className="fw-semibold">{variant.branchName}</td>
                        <td>{variant.size}</td>
                        <td className="text-success fw-bold">{variant.quantity}</td>
                        <td className="text-muted">
                          {variant.updatedAt
                            ? new Date(variant.updatedAt).toLocaleString()
                            : "Never updated"}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleUpdate(variant.raw)}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Inventory;


