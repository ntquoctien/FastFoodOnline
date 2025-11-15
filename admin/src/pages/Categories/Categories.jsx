import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const defaultForm = {
  name: "",
  description: "",
  isActive: true,
};

const Categories = ({ url }) => {
  const { token, role } = useContext(StoreContext);
  const isAdmin = role === "admin";
  const apiBaseUrl = useMemo(
    () =>
      url ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:4000",
    [url]
  );
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredCategories = useMemo(() => {
    if (showInactive) return categories;
    return categories.filter((category) => category.isActive);
  }, [categories, showInactive]);

  const fetchCategories = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v2/categories`, {
        headers: { token },
        params: { includeInactive: true },
      });
      if (response.data?.success) {
        setCategories(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Unable to load categories");
      }
    } catch (error) {
      console.error("Fetch categories failed", error);
      toast.error("Unable to load categories");
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, isAdmin]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingCategory(null);
    setForm(defaultForm);
  };

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };
    const request = editingCategory
      ? axios.patch(`${apiBaseUrl}/api/v2/categories/${editingCategory._id}`, payload, {
          headers: { token },
        })
      : axios.post(`${apiBaseUrl}/api/v2/categories`, payload, {
          headers: { token },
        });
    try {
      const response = await request;
      if (response.data?.success) {
        toast.success(
          editingCategory ? "Category updated" : "Category created"
        );
        closeForm();
        fetchCategories();
      } else {
        toast.error(response.data?.message || "Unable to save category");
      }
    } catch (error) {
      console.error("Save category failed", error);
      toast.error("Unable to save category");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    if (!token) return;
    try {
      const response = await axios.patch(
        `${apiBaseUrl}/api/v2/categories/${category._id}`,
        { isActive: !category.isActive },
        { headers: { token } }
      );
      if (response.data?.success) {
        const updated = response.data.data;
        setCategories((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        toast.success(
          updated.isActive ? "Category activated" : "Category archived"
        );
      } else {
        toast.error(response.data?.message || "Unable to update status");
      }
    } catch (error) {
      console.error("Toggle category status failed", error);
      toast.error("Unable to update status");
    }
  };

  const confirmDelete = (category) => setDeleteTarget(category);
  const cancelDelete = () => setDeleteTarget(null);

  const renderFormModal = () => {
    if (!formOpen) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          onClick={closeForm}
        >
          <div
            className="modal-dialog modal-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-1">
                    {editingCategory ? "Edit category" : "New category"}
                  </h5>
                  <small className="text-muted">
                    Group related dishes and control availability.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeForm}
                />
              </div>
              <form onSubmit={submitForm}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={updateForm}
                      placeholder="Eg. Signature pizzas"
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={form.description}
                      onChange={updateForm}
                      rows={4}
                      placeholder="Explain what makes this category unique"
                      disabled={saving}
                    />
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="category-active"
                      name="isActive"
                      checked={form.isActive}
                      onChange={updateForm}
                      disabled={saving}
                    />
                    <label className="form-check-label" htmlFor="category-active">
                      Available for sale
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  const renderDeleteModal = () => {
    if (!deleteTarget) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="alertdialog"
          onClick={cancelDelete}
        >
          <div
            className="modal-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="mb-0">Delete category</h5>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to remove{" "}
                  <strong>{deleteTarget.name}</strong>? This action cannot be
                  undone.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={cancelDelete}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={deleteCategory}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  const deleteCategory = async () => {
    if (!deleteTarget || !token) return;
    try {
      const response = await axios.delete(
        `${apiBaseUrl}/api/v2/categories/${deleteTarget._id}`,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Category deleted");
        setCategories((prev) =>
          prev.filter((category) => category._id !== deleteTarget._id)
        );
        setDeleteTarget(null);
      } else {
        toast.error(response.data?.message || "Unable to delete category");
      }
    } catch (error) {
      console.error("Delete category failed", error);
      toast.error("Unable to delete category");
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-heading">
        <div className="page-title-headings">
          <h3>Categories</h3>
          <p className="text-muted mb-0">
            You do not have permission to manage categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Categories</h3>
          <p className="text-muted mb-0">
            Organise the menu into clear groups and control availability.
          </p>
        </div>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="categories-show-inactive"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="categories-show-inactive">
              Show archived
            </label>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + New category
          </button>
        </div>
      </div>

      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            {showInactive
              ? "No categories have been created yet."
              : "No active categories available."}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="fw-semibold">{category.name}</div>
                      <small className="text-muted">{category._id}</small>
                    </td>
                    <td className="text-muted">{category.description || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          category.isActive
                            ? "btn-outline-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleStatus(category)}
                      >
                        {category.isActive ? "Selling" : "Not for sale"}
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => openEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => confirmDelete(category)}
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

      {renderFormModal()}
      {renderDeleteModal()}
    </div>
  );

};

export default Categories;
