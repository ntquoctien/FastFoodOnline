import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";

const DEFAULT_VARIANT = {
  size: "",
  price: "",
  isDefault: true,
  unitType: "",
  measurementUnitId: "",
  unitValue: "",
  unitSymbol: "",
  unitOrder: "",
  useCustomUnit: false,
};
const DEFAULT_UNIT_TYPES = ["size", "volume", "weight", "quantity", "custom"];

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [image, setImage] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", categoryId: "" });
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variants, setVariants] = useState([DEFAULT_VARIANT]);
  const [menuPreview, setMenuPreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewBranch, setPreviewBranch] = useState("all");
  const [branchScope, setBranchScope] = useState({ mode: "all", selected: [] });
  const [inventoryModal, setInventoryModal] = useState(null);
  const [inventoryValues, setInventoryValues] = useState({});
  const [inventorySaving, setInventorySaving] = useState(false);
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [unitManagerOpen, setUnitManagerOpen] = useState(false);
  const [unitManagerLoading, setUnitManagerLoading] = useState(false);
  const [unitManagerList, setUnitManagerList] = useState([]);
  const [unitForm, setUnitForm] = useState({
    type: "",
    value: "",
    symbol: "",
  });
  const [unitFormSubmitting, setUnitFormSubmitting] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);

  const measurementUnitLookup = useMemo(() => {
    const map = new Map();
    measurementUnits.forEach((unit) => {
      if (unit?._id) {
        map.set(unit._id, unit);
      }
    });
    return map;
  }, [measurementUnits]);

  const mergedUnitTypes = useMemo(() => {
    const dynamicTypes = Array.from(
      new Set(measurementUnits.map((unit) => unit.type).filter(Boolean))
    );
    const combined = Array.from(
      new Set([
        ...DEFAULT_UNIT_TYPES,
        ...dynamicTypes.map((type) => type.trim().toLowerCase()),
      ])
    ).filter(Boolean);
    return combined;
  }, [measurementUnits]);

  const unitsByType = useMemo(() => {
    return measurementUnits.reduce((acc, unit) => {
      const typeKey = (unit?.type || "").trim().toLowerCase();
      if (!typeKey) return acc;
      if (!acc[typeKey]) {
        acc[typeKey] = [];
      }
      acc[typeKey].push(unit);
      return acc;
    }, {});
  }, [measurementUnits]);

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(
    () => () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl]
  );

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      categoryId: categories[0]?._id || "",
    });
    setVariants([DEFAULT_VARIANT]);
    setImage(null);
    setBranchScope({
      mode: "all",
      selected: branches.map((branch) => branch._id),
    });
  }, [categories, branches]);

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    setLoadingPreview(true);
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`, {
        headers: { token },
      });
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to load menu data");
        return;
      }
      const payload = response.data.data || {};
      const nextCategories = payload.categories || [];
      const nextBranches = payload.branches || [];
      const foods = payload.foods || [];
      const units = payload.measurementUnits || [];

      setCategories(nextCategories);
      setBranches(nextBranches);
      setMeasurementUnits(Array.isArray(units) ? units : []);
      setMenuPreview(Array.isArray(foods) ? foods : []);
      setBranchScope((prev) => {
        const availableIds = nextBranches.map((branch) => branch._id);
        if (prev.mode === "custom") {
          const filtered = prev.selected.filter((id) => availableIds.includes(id));
          return {
            mode: "custom",
            selected: filtered,
          };
        }
        return {
          mode: "all",
          selected: availableIds,
        };
      });
      setForm((current) => ({
        ...current,
        categoryId: nextCategories[0]?._id || "",
      }));
    } catch (error) {
      console.error("Menu metadata fetch failed", error);
      toast.error("Unable to load menu data");
    } finally {
      setLoadingPreview(false);
    }
  }, [token, url]);

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login first");
      navigate("/");
      return;
    }
    fetchMeta();
  }, [token, role, fetchMeta, navigate]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateVariant = (index, field, value) => {
    if (typeof field === "object" && field !== null) {
      const updates = field;
      setVariants((prev) =>
        prev.map((variant, i) => (i === index ? { ...variant, ...updates } : variant))
      );
      return;
    }
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const normaliseUnitTypeInput = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const handleVariantUnitTypeChange = (index, unitTypeRaw) => {
    const unitType = normaliseUnitTypeInput(unitTypeRaw);
    const isCustom = unitType === "custom" || unitType === "";
    updateVariant(index, {
      unitType,
      measurementUnitId: "",
      useCustomUnit: isCustom,
      size: isCustom ? "" : variants[index]?.size || "",
      unitValue: "",
      unitSymbol: "",
      unitOrder: "",
    });
  };

  const applyMeasurementUnitToVariant = (index, unit) => {
    if (!unit) {
      updateVariant(index, {
        measurementUnitId: "",
        useCustomUnit: true,
        size: "",
        unitValue: "",
        unitSymbol: "",
        unitOrder: "",
      });
      return;
    }
    updateVariant(index, {
      measurementUnitId: unit._id,
      unitType: normaliseUnitTypeInput(unit.type || variants[index]?.unitType || ""),
      useCustomUnit: false,
      size: unit.label,
      unitValue: unit.value ?? "",
      unitSymbol: unit.symbol || "",
      unitOrder:
        unit.order !== undefined && unit.order !== null
          ? unit.order
          : unit.value ?? "",
    });
  };

  const handleVariantUnitChange = (index, selectedValue) => {
    if (selectedValue === "__custom") {
      updateVariant(index, {
        measurementUnitId: "",
        useCustomUnit: true,
        size: "",
        unitValue: "",
        unitSymbol: "",
        unitOrder: "",
      });
      return;
    }
    const unit = measurementUnitLookup.get(selectedValue);
    if (unit) {
      applyMeasurementUnitToVariant(index, unit);
    } else {
      updateVariant(index, {
        measurementUnitId: "",
        size: "",
        unitValue: "",
        unitSymbol: "",
        unitOrder: "",
        useCustomUnit: true,
      });
    }
  };

  const handleCustomLabelChange = (index, value) => {
    updateVariant(index, { size: value, unitLabel: value, useCustomUnit: true });
  };

  const handleCustomValueChange = (index, value) => {
    updateVariant(index, { unitValue: value, unitOrder: value, useCustomUnit: true });
  };

  const handleCustomSymbolChange = (index, value) => {
    updateVariant(index, { unitSymbol: value, useCustomUnit: true });
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { ...DEFAULT_VARIANT, isDefault: false }]);
  };

  const removeVariantRow = (index) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((variant) => variant.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  };

  const setDefaultVariant = (index) => {
    setVariants((prev) =>
      prev.map((variant, i) => ({
        ...variant,
        isDefault: i === index,
      }))
    );
  };

  const handleScopeModeChange = (mode) => {
    if (mode === "all") {
      setBranchScope({
        mode: "all",
        selected: branches.map((branch) => branch._id),
      });
      return;
    }
    setBranchScope((prev) => ({
      mode: "custom",
      selected: prev.selected.length ? prev.selected : branches.map((branch) => branch._id),
    }));
  };

  const toggleBranchSelection = (branchId) => {
    setBranchScope((prev) => {
      const hasBranch = prev.selected.includes(branchId);
      const nextSelected = hasBranch
        ? prev.selected.filter((id) => id !== branchId)
        : [...prev.selected, branchId];
      return {
        ...prev,
        selected: nextSelected,
      };
    });
  };

  const resetUnitForm = useCallback(() => {
    setUnitForm({
      type: "",
      value: "",
      symbol: "",
    });
    setEditingUnitId(null);
  }, []);

  const loadUnitManagerList = useCallback(
    async (includeInactive = true) => {
      try {
        setUnitManagerLoading(true);
        const query = includeInactive ? "?includeInactive=true" : "";
        const response = await axios.get(`${url}/api/v2/units${query}`, {
          headers: token ? { token } : undefined,
        });
        if (response.data?.success) {
          const items = response.data.data || [];
          setUnitManagerList(items);
          const activeUnits = items.filter((unit) => unit.isActive);
          if (includeInactive) {
            setMeasurementUnits(activeUnits);
          }
        }
      } catch (error) {
        console.error("Failed to load measurement units", error);
        toast.error("Không thể tải danh sách đơn vị");
      } finally {
        setUnitManagerLoading(false);
      }
    },
    [token, url]
  );

  const openUnitManager = () => {
    setUnitManagerOpen(true);
    loadUnitManagerList(true);
  };

  const closeUnitManager = () => {
    setUnitManagerOpen(false);
    resetUnitForm();
  };

  const handleUnitFormChange = (event) => {
    const { name, value } = event.target;
    setUnitForm((prev) => ({ ...prev, [name]: value }));
  };

  const refreshActiveUnits = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/units`);
      if (response.data?.success) {
        setMeasurementUnits(response.data.data || []);
      }
    } catch (error) {
      console.warn("Unable to refresh measurement units", error);
    }
  };

  const handleUnitFormSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    const normalisedType = normaliseUnitTypeInput(unitForm.type || unitForm.symbol);
    if (!normalisedType) {
      toast.error("Loại đơn vị là bắt buộc");
      return;
    }
    const numericValue = Number(unitForm.value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      toast.error("Giá trị phải là số lớn hơn 0");
      return;
    }
    setUnitFormSubmitting(true);
    try {
      const payload = {
        type: normalisedType,
        value: numericValue,
        symbol: unitForm.symbol,
      };
      if (editingUnitId) {
        await axios.put(`${url}/api/v2/units/${editingUnitId}`, payload, {
          headers: { token },
        });
        toast.success("Đã cập nhật đơn vị");
      } else {
        await axios.post(`${url}/api/v2/units`, payload, {
          headers: { token },
        });
        toast.success("Đã thêm đơn vị mới");
      }
      await loadUnitManagerList(true);
      await refreshActiveUnits();
      resetUnitForm();
    } catch (error) {
      console.error("Failed to save measurement unit", error);
      toast.error(
        error.response?.data?.message || "Không thể lưu đơn vị đo lường"
      );
    } finally {
      setUnitFormSubmitting(false);
    }
  };

  const handleEditUnit = (unit) => {
    setEditingUnitId(unit._id);
    setUnitForm({
      type: unit.type || "",
      value:
        unit.value !== undefined && unit.value !== null ? String(unit.value) : "",
      symbol: unit.symbol || "",
    });
  };

  const handleToggleUnit = async (unit) => {
    if (!token) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    try {
      await axios.put(
        `${url}/api/v2/units/${unit._id}`,
        { isActive: !unit.isActive },
        { headers: { token } }
      );
      toast.success("Đã cập nhật trạng thái đơn vị");
      await loadUnitManagerList(true);
      await refreshActiveUnits();
    } catch (error) {
      console.error("Failed to toggle unit", error);
      toast.error("Không thể cập nhật trạng thái đơn vị");
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (!token) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(`Xóa đơn vị "${unit.label}"?`);
    if (!confirmed) return;
    try {
      await axios.delete(`${url}/api/v2/units/${unit._id}`, {
        headers: { token },
      });
      toast.success("Đã xóa đơn vị");
      await loadUnitManagerList(true);
      await refreshActiveUnits();
    } catch (error) {
      console.error("Failed to delete unit", error);
      toast.error("Không thể xóa đơn vị");
    }
  };

  const activeBranchIds = useMemo(() => {
    if (branchScope.mode === "custom") {
      return branchScope.selected;
    }
    return branches.map((branch) => branch._id);
  }, [branchScope, branches]);

  const previewItems = useMemo(() => {
    if (previewBranch === "all") return menuPreview;
    return menuPreview.filter((food) =>
      (food.variants || []).some((variant) => variant.branchId === previewBranch)
    );
  }, [menuPreview, previewBranch]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedVariants = variants
      .map((variant) => {
        const selectedUnit =
          variant.measurementUnitId && measurementUnitLookup.get(variant.measurementUnitId);
        const resolvedSize = (variant.size || selectedUnit?.label || "").trim();
        const numericPrice = Number(variant.price);
        return {
          ...variant,
          size: resolvedSize,
          price: numericPrice,
          unitType: variant.unitType || selectedUnit?.type || "",
          measurementUnitId: selectedUnit?._id || variant.measurementUnitId || "",
          unitValue:
            variant.unitValue !== "" && variant.unitValue !== undefined
              ? variant.unitValue
              : selectedUnit?.value ?? "",
          unitSymbol: variant.unitSymbol || selectedUnit?.symbol || "",
          unitOrder:
            variant.unitOrder !== "" && variant.unitOrder !== undefined
              ? variant.unitOrder
              : selectedUnit?.order ?? selectedUnit?.value ?? "",
        };
      })
      .filter((variant) => variant.size && Number.isFinite(variant.price));

    if (!trimmedVariants.length) {
      toast.error("Please add at least one variant with size and price");
      return;
    }

    if (!activeBranchIds.length) {
      toast.error("Select at least one branch to publish this item");
      return;
    }

    const expandedVariants = [];
    trimmedVariants.forEach((variant) => {
      activeBranchIds.forEach((branchId, branchIndex) => {
        const presetUnit =
          variant.measurementUnitId && measurementUnitLookup.get(variant.measurementUnitId);
        const unitMeta = presetUnit
          ? {
              measurementUnitId: presetUnit._id,
              unitType: normaliseUnitTypeInput(presetUnit.type),
              unitLabel: presetUnit.label,
              unitValue: presetUnit.value,
              unitSymbol: presetUnit.symbol,
              unitOrder:
                presetUnit.order !== undefined
                  ? presetUnit.order
                  : presetUnit.value ?? 0,
            }
          : {
              unitType: normaliseUnitTypeInput(variant.unitType) || "custom",
              unitLabel: variant.size,
              unitValue:
                variant.unitValue !== "" && variant.unitValue !== undefined
                  ? Number(variant.unitValue)
                  : null,
              unitSymbol: variant.unitSymbol || "",
              unitOrder:
                variant.unitOrder !== "" && variant.unitOrder !== undefined
                  ? Number(variant.unitOrder)
                  : variant.unitValue
                  ? Number(variant.unitValue)
                  : 0,
            };

        expandedVariants.push({
          size: variant.size,
          price: Number(variant.price),
          branchId,
          isDefault: variant.isDefault && branchIndex === 0,
          ...unitMeta,
        });
      });
    });

    if (!expandedVariants.some((variant) => variant.isDefault)) {
      expandedVariants[0].isDefault = true;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("categoryId", form.categoryId);
    if (image) {
      formData.append("image", image);
    }
    formData.append("variants", JSON.stringify(expandedVariants));

    setSubmitting(true);
    try {
      const response = await axios.post(`${url}/api/v2/menu/foods`, formData, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Food item created");
        setModalOpen(false);
        await fetchMeta();
        const created = response.data.data;
        if (created?.variants?.length) {
          const initialValues = {};
          created.variants.forEach((variant) => {
            initialValues[variant._id] = "";
          });
          setInventoryModal({
            food: created,
            variants: created.variants,
          });
          setInventoryValues(initialValues);
        }
        resetForm();
      } else {
        toast.error(response.data?.message || "Could not create food");
      }
    } catch (error) {
      console.error("Create food failed", error);
      toast.error("Unable to create food item");
    } finally {
      setSubmitting(false);
    }
  };


  const renderUnitManagerModal = () => {
    if (!unitManagerOpen) return null;
    return (
      <>
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-0">Measurement units</h5>
                  <small className="text-muted">
                    Định nghĩa các đơn vị kích cỡ để dùng khi tạo món mới.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeUnitManager}
                />
              </div>
              <div className="modal-body">
                                <form className="row g-3 mb-4" onSubmit={handleUnitFormSubmit}>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Loại</label>
                    <input
                      name="type"
                      className="form-control"
                      list="unit-type-suggestions"
                      placeholder="Nhập loại (vd: size, volume...)"
                      value={unitForm.type}
                      onChange={handleUnitFormChange}
                      required
                    />
                    <datalist id="unit-type-suggestions">
                      {mergedUnitTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">
                      Giá trị số (để sắp xếp)
                    </label>
                    <input
                      name="value"
                      type="number"
                      className="form-control"
                      placeholder="500"
                      value={unitForm.value}
                      onChange={handleUnitFormChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Ký hiệu</label>
                    <input
                      name="symbol"
                      className="form-control"
                      placeholder="ml, g, pcs..."
                      value={unitForm.symbol}
                      onChange={handleUnitFormChange}
                    />
                  </div>
                  <div className="col-12 d-flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={unitFormSubmitting}
                    >
                      {unitFormSubmitting
                        ? "Saving..."
                        : editingUnitId
                        ? "Update unit"
                        : "Add unit"}
                    </button>
                    {editingUnitId ? (
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={resetUnitForm}
                        disabled={unitFormSubmitting}
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </form>
                <hr />
                {unitManagerLoading ? (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border text-primary mb-3" role="status" />
                    Đang tải danh sách đơn vị...
                  </div>
                ) : unitManagerList.length === 0 ? (
                  <p className="text-center text-muted mb-0">
                    Chưa có đơn vị nào. Hãy thêm mới ở biểu mẫu phía trên.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                                            <thead>
                        <tr>
                          <th>Tên hiển thị</th>
                          <th>Loại</th>
                          <th>Giá trị</th>
                          <th>Ký hiệu</th>
                          <th>Trạng thái</th>
                          <th className="text-end">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unitManagerList.map((unit) => (
                          <tr key={unit._id}>
                            <td>
                              {[unit.value ?? "", unit.symbol || ""]
                                .filter(Boolean)
                                .join(" ")
                                .trim() || unit.label}
                            </td>
                            <td className="text-capitalize">{unit.type || "-"}</td>
                            <td>{unit.value ?? "-"}</td>
                            <td>{unit.symbol || "-"}</td>
                            <td>
                              {unit.isActive ? (
                                <span className="badge bg-light-success text-success">
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-light-secondary text-secondary">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="btn-group">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleEditUnit(unit)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleToggleUnit(unit)}
                                >
                                  {unit.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteUnit(unit)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
    );
  };

  const branchNameMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => {
      map.set(branch._id, branch.name);
    });
    return map;
  }, [branches]);

  const MAX_BRANCH_SUMMARY_LINES = 3;
  const renderVariantSummary = (variants = []) => {
    if (!variants.length) return "No variants";
    const groups = variants.reduce((acc, variant) => {
      const branchLabel =
        branchNameMap.get(variant.branchId) || variant.branchName || "Branch";
      if (!acc[branchLabel]) acc[branchLabel] = [];
      acc[branchLabel].push(
        `${variant.size} · ${formatCurrency(variant.price)}`
      );
      return acc;
    }, {});

    const entries = Object.entries(groups);
    const visibleEntries = entries.slice(0, MAX_BRANCH_SUMMARY_LINES);
    const hiddenCount = entries.length - visibleEntries.length;

    return (
      <>
        {visibleEntries.map(([branchLabel, items]) => (
          <div key={branchLabel}>
            {branchLabel}: {items.join(" – ")}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="text-muted">
            và tại {hiddenCount} chi nhánh khác
          </div>
        )}
      </>
    );
  };

  const handleInventoryChange = (variantId, value) => {
    setInventoryValues((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const closeInventoryModal = () => {
    setInventoryModal(null);
    setInventoryValues({});
    setInventorySaving(false);
  };

  const handleInventorySave = async () => {
    if (!inventoryModal) {
      return;
    }
    const entries = Object.entries(inventoryValues || {}).filter(
      ([, value]) => value !== "" && !Number.isNaN(Number(value))
    );
    if (!entries.length) {
      closeInventoryModal();
      return;
    }
    setInventorySaving(true);
    try {
      await Promise.all(
        entries.map(([variantId, value]) => {
          const variant = inventoryModal.variants.find(
            (item) => item._id === variantId
          );
          if (!variant) return null;
          return axios.post(
            `${url}/api/v2/inventory`,
            {
              branchId: variant.branchId,
              foodVariantId: variant._id,
              quantity: Number(value),
            },
            { headers: { token } }
          );
        })
      );
      toast.success("Inventory updated");
      closeInventoryModal();
      await fetchMeta();
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to set inventory");
      setInventorySaving(false);
    }
  };

  const renderCreationModal = () => {
    if (!modalOpen) return null;
    return (
      <>
        <div
          className="modal fade show d-block create-food-modal"
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable create-food-modal__dialog">
            <div className="modal-content border-0 rounded-4 create-food-modal__content">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-0">Create Food Item</h5>
                  <small className="text-muted">
                    Configure the dish, variants, and branch availability.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={onSubmitHandler} className="d-flex flex-column flex-grow-1">
                <div className="modal-body create-food-modal__body">
                  <div className="row g-4">
                    <div className="col-12 col-lg-4">
                      <div className="border rounded-4 p-3 h-100">
                        <p className="text-uppercase text-muted small mb-2">
                          Feature image
                        </p>
                        <label
                          htmlFor="upload-image"
                          className="ratio ratio-4x3 border border-2 border-primary rounded-4 d-flex align-items-center justify-content-center bg-light text-center cursor-pointer"
                          style={{ minHeight: 180 }}
                        >
                          <img
                            src={imagePreviewUrl || assets.upload_area}
                            alt="Upload"
                            className="img-fluid object-fit-cover rounded-4"
                          />
                        </label>
                        <input
                          id="upload-image"
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(event) =>
                            setImage(event.target.files?.[0] || null)
                          }
                        />
                        <small className="text-muted d-block mt-2">
                          Recommended 1200×800px, JPG or PNG up to 3MB.
                        </small>
                      </div>
                    </div>
                    <div className="col-12 col-lg-8">
                      <div className="border rounded-4 p-3">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Product name
                          </label>
                          <input
                            className="form-control"
                            name="name"
                            value={form.name}
                            onChange={updateForm}
                            placeholder="Eg. Spicy garlic ramen"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Description
                          </label>
                          <textarea
                            className="form-control"
                            name="description"
                            value={form.description}
                            onChange={updateForm}
                            rows={4}
                            placeholder="Describe the dish and highlight ingredients."
                            required
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fw-semibold">
                            Category
                          </label>
                          <select
                            className="form-select"
                            name="categoryId"
                            value={form.categoryId}
                            onChange={updateForm}
                            required
                          >
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border rounded-4 my-4">
                    <div className="card-body">
                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                        <div>
                          <h6 className="mb-1">Branch availability</h6>
                          <small className="text-muted">
                            Publish everywhere or target selected locations.
                          </small>
                        </div>
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="branch-scope"
                              id="branch-scope-all"
                              value="all"
                              checked={branchScope.mode === "all"}
                              onChange={() => handleScopeModeChange("all")}
                            />
                            <label
                              htmlFor="branch-scope-all"
                              className="form-check-label"
                            >
                              All branches
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="branch-scope"
                              id="branch-scope-custom"
                              value="custom"
                              checked={branchScope.mode === "custom"}
                              onChange={() => handleScopeModeChange("custom")}
                            />
                            <label
                              htmlFor="branch-scope-custom"
                              className="form-check-label"
                            >
                              Custom selection
                            </label>
                          </div>
                        </div>
                      </div>
                      {branchScope.mode === "custom" ? (
                        <div className="row row-cols-1 row-cols-md-2 g-2 mt-3">
                          {branches.map((branch) => (
                            <div key={branch._id} className="col">
                              <label className="form-check form-switch border rounded-3 px-3 py-2 d-flex align-items-center justify-content-between">
                                <span className="fw-semibold">{branch.name}</span>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={branchScope.selected.includes(branch._id)}
                                  onChange={() => toggleBranchSelection(branch._id)}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="card border rounded-4">
                    <div className="card-body">
                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                        <div>
                          <h6 className="mb-1">Variants &amp; pricing</h6>
                          <small className="text-muted">
                            Add sizes or portion options along with pricing.
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={addVariantRow}
                        >
                          + Add variant
                        </button>
                      </div>
                      <div className="d-flex flex-column gap-3 variant-scroll-container">
                        {variants.map((variant, index) => (
                          <div
                            key={`variant-${index}`}
                            className="row g-3 align-items-end border rounded-4 p-3"
                          >
                            <div className="col-12 col-lg-3">
                              <label className="form-label fw-semibold">
                                Loại đơn vị
                              </label>
                              <select
                                className="form-select"
                                value={variant.unitType}
                                onChange={(event) =>
                                  handleVariantUnitTypeChange(index, event.target.value)
                                }
                              >
                                <option value="">Chọn loại</option>
                                {mergedUnitTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                                <option value="custom">Tùy chỉnh</option>
                              </select>
                            </div>
                            <div className="col-12 col-lg-3">
                              <label className="form-label fw-semibold">
                                Giá trị / kích cỡ
                              </label>
                              <select
                                className="form-select"
                                value={
                                  variant.useCustomUnit || !variant.measurementUnitId
                                    ? "__custom"
                                    : variant.measurementUnitId
                                }
                                onChange={(event) =>
                                  handleVariantUnitChange(index, event.target.value)
                                }
                                disabled={
                                  !variant.unitType ||
                                  variant.unitType == "custom"
                                }
                              >
                                <option value="">Chọn giá trị</option>
                                {(unitsByType[variant.unitType] || [])
                                  .slice()
                                  .sort((a, b) => {
                                    const symbolA = (a.symbol || "").toLowerCase();
                                    const symbolB = (b.symbol || "").toLowerCase();
                                    if (symbolA && symbolB && symbolA !== symbolB) {
                                      return symbolA.localeCompare(symbolB);
                                    }
                                    return (
                                      (b.order ?? b.value ?? 0) -
                                      (a.order ?? a.value ?? 0)
                                    );
                                  })
                                  .map((unit) => (
                                    <option key={unit._id} value={unit._id}>
                                      {unit.label}
                                    </option>
                                  ))}
                                <option value="__custom">Giá trị tùy chỉnh</option>
                              </select>
                            </div>
                            <div className="col-12 col-lg-3">
                              <label className="form-label fw-semibold">
                                Nhãn hiển thị
                              </label>
                              <input
                                className="form-control"
                                type="text"
                                placeholder="Large, Combo..."
                                value={variant.size}
                                onChange={(event) =>
                                  handleCustomLabelChange(index, event.target.value)
                                }
                                required
                                readOnly={
                                  !variant.useCustomUnit && Boolean(variant.measurementUnitId)
                                }
                              />
                            </div>
                            <div className="col-12 col-lg-3">
                              <label className="form-label fw-semibold">
                                Giá bán
                              </label>
                              <input
                                className="form-control"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="15.00"
                                value={variant.price}
                                onChange={(event) =>
                                  updateVariant(index, "price", event.target.value)
                                }
                                required
                              />
                            </div>
                            {(variant.useCustomUnit || !variant.measurementUnitId) && (
                              <>
                                <div className="col-12 col-md-6 col-lg-4">
                                  <label className="form-label fw-semibold">
                                    Giá trị sắp xếp (số)
                                  </label>
                                  <input
                                    className="form-control"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Ví dụ: 350"
                                    value={variant.unitValue}
                                    onChange={(event) =>
                                      handleCustomValueChange(index, event.target.value)
                                    }
                                  />
                                  <small className="text-muted">
                                    Dùng để sắp xếp kích cỡ từ lớn đến nhỏ
                                  </small>
                                </div>
                                <div className="col-12 col-md-6 col-lg-4">
                                  <label className="form-label fw-semibold">
                                    Ký hiệu / đơn vị
                                  </label>
                                  <input
                                    className="form-control"
                                    type="text"
                                    placeholder="ml, g, pcs..."
                                    value={variant.unitSymbol}
                                    onChange={(event) =>
                                      handleCustomSymbolChange(index, event.target.value)
                                    }
                                  />
                                </div>
                              </>
                            )}
                            <div className="col-12 col-md-6">
                              <div className="form-check mt-2">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="defaultVariant"
                                  id={`variant-default-${index}`}
                                  checked={variant.isDefault}
                                  onChange={() => setDefaultVariant(index)}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`variant-default-${index}`}
                                >
                                  Default option
                                </label>
                              </div>
                            </div>
                            <div className="col-12 col-md-6 text-md-end">
                              <button
                                type="button"
                                className="btn btn-outline-danger w-100 w-md-auto mt-2"
                                onClick={() => removeVariantRow(index)}
                                disabled={variants.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 justify-content-between flex-wrap">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Publishing..." : "Publish item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
    );
  };

  const renderInventoryModal = () => {
    if (!inventoryModal) return null;
    return (
      <>
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-0">Set initial inventory</h5>
                  <small className="text-muted">
                    {inventoryModal.food?.name || "New item"}
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={closeInventoryModal} />
              </div>
              <div className="modal-body">
                {inventoryModal.variants.map((variant) => (
                  <div key={variant._id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{variant.size}</h6>
                        <small className="text-muted">
                          {branchNameMap.get(variant.branchId) || "Branch"} ·{" "}
                          {formatCurrency(variant.price)}
                        </small>
                      </div>
                      <div className="ms-3" style={{ minWidth: 140 }}>
                        <label className="form-label fw-semibold mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={inventoryValues[variant._id] ?? ""}
                          onChange={(event) =>
                            handleInventoryChange(variant._id, event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={closeInventoryModal}
                  disabled={inventorySaving}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleInventorySave}
                  disabled={inventorySaving}
                >
                  {inventorySaving ? "Saving..." : "Save inventory"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
    );
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-title-headings mb-3">
          <div>
            <h3 className="mb-1">Food Builder</h3>
            <p className="text-muted mb-0">
              Launch new dishes and assign them to specific branches.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={openUnitManager}
            >
              Manage units
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
              + New Item
            </button>
          </div>
        </div>
        <section className="card border rounded-4">
          <div className="card-header border-0 d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
            <div>
              <h5 className="mb-1">Menu Overview</h5>
              <small className="text-muted">Filter by branch to review their menu.</small>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <select
                className="form-select"
                value={previewBranch}
                onChange={(event) => setPreviewBranch(event.target.value)}
              >
                <option value="all">All branches</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-light"
                onClick={fetchMeta}
                disabled={loadingPreview}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            {loadingPreview ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted mb-0">Loading menu…</p>
              </div>
            ) : previewItems.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No menu items for this view yet. Add your first dish!
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                {previewItems.map((food) => (
                  <div key={food._id} className="col">
                    <article className="border rounded-4 h-100 p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h5 className="mb-0">{food.name}</h5>
                        <span className="badge bg-light text-primary">
                          {food.categoryName || "Uncategorized"}
                        </span>
                      </div>
                      <p className="text-muted mb-3">
                        {food.description || "No description available."}
                      </p>
                      <div className="small fw-semibold text-primary">
                        {renderVariantSummary(food.variants)}
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {renderCreationModal()}
      {renderUnitManagerModal()}
      {renderInventoryModal()}
    </>
  );
};

export default Add;








