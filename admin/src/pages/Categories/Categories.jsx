import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./Categories.css";
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
      <div className="categories-page">
        <header className="categories-header">
          <div>
            <h2>Categories</h2>
            <p>You do not have permission to manage categories.</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <header className="categories-header">
        <div>
          <h2>Categories</h2>
          <p>Organise the menu into clear groups and control availability.</p>
        </div>
        <div className="categories-header-actions">
          <label className="categories-filter">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            <span>Show archived</span>
          </label>
          <button type="button" onClick={openCreate}>
            + New category
          </button>
        </div>
      </header>

      <section className="categories-panel">
        {loading ? (
          <div className="categories-empty">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="categories-empty">
            {showInactive
              ? "No categories have been created yet."
              : "No active categories available."}
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div className="categories-name">
                      <strong>{category.name}</strong>
                      <span className="categories-id">{category._id}</span>
                    </div>
                  </td>
                  <td>{category.description || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className={`categories-status ${
                        category.isActive ? "is-active" : "is-inactive"
                      }`}
                      onClick={() => toggleStatus(category)}
                    >
                      {category.isActive ? "Selling" : "Not for sale"}
                    </button>
                  </td>
                  <td className="categories-actions">
                    <button type="button" onClick={() => openEdit(category)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => confirmDelete(category)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {formOpen ? (
        <div className="categories-modal" role="dialog" aria-modal="true">
          <div className="categories-backdrop" onClick={closeForm} />
          <div className="categories-modal-card">
            <header>
              <h3>{editingCategory ? "Edit category" : "New category"}</h3>
            </header>
            <form onSubmit={submitForm}>
              <label>
                <span>Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="Eg. Signature pizzas"
                  required
                  disabled={saving}
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows={4}
                  placeholder="Explain what makes this category unique"
                  disabled={saving}
                />
              </label>
              <label className="categories-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={updateForm}
                  disabled={saving}
                />
                <span>Available for sale</span>
              </label>
              <div className="categories-modal-actions">
                <button type="button" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="categories-modal" role="alertdialog" aria-modal="true">
          <div className="categories-backdrop" onClick={cancelDelete} />
          <div className="categories-modal-card categories-modal-danger">
            <h3>Delete category</h3>
            <p>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="categories-modal-actions">
              <button type="button" onClick={cancelDelete}>
                Cancel
              </button>
              <button type="button" className="is-danger" onClick={deleteCategory}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Categories;
