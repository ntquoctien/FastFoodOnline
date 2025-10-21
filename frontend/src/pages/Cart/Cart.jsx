import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/frontend_assets/assets";

const Cart = () => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    variantMap,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const cartEntries = Object.entries(cartItems).filter(([, qty]) => qty > 0);
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const grandTotal = subtotal + deliveryFee;

  const handleClearItem = async (variantId, quantity) => {
    for (let count = 0; count < quantity; count += 1) {
      await removeFromCart(variantId);
    }
  };

  return (
    <div className="cart">
      <div className="cart-layout">
        <section className="cart-panel">
          <header className="cart-panel-header">
            <div>
              <h2>Your order</h2>
              <p>
                {cartEntries.length
                  ? `${cartEntries.length} item${
                      cartEntries.length > 1 ? "s" : ""
                    } in the basket`
                  : "Add dishes from the menu to get started"}
              </p>
            </div>
          </header>

          {cartEntries.length === 0 ? (
            <div className="cart-empty">
              <img
                src={assets.basket_icon}
                alt="Empty cart"
                className="cart-empty-illustration"
              />
              <h3>Your cart is empty</h3>
              <p>Explore the menu and add something tasty.</p>
            </div>
          ) : (
            <ul className="cart-list">
              {cartEntries.map(([variantId, quantity]) => {
                const variant = variantMap[variantId];
                if (!variant) return null;
                const price = variant.price;
                const total = price * quantity;
                const imageSrc = variant.foodImage
                  ? `${url}/images/${variant.foodImage}`
                  : assets.placeholder_image;
                return (
                  <li key={variantId} className="cart-list-item">
                    <div className="cart-item-media">
                      <img src={imageSrc} alt={variant.foodName} />
                    </div>
                    <div className="cart-item-content">
                      <header className="cart-item-header">
                        <h3>{variant.foodName}</h3>
                        <span className="cart-item-price">
                          ${price.toFixed(2)}
                        </span>
                      </header>
                      <div className="cart-item-meta">
                        <span className="cart-item-badge">{variant.size}</span>
                        <span className="cart-item-branch">
                          {variant.branchName || "Branch"}
                        </span>
                      </div>
                      <div className="cart-item-footer">
                        <div className="cart-quantity-control">
                          <button
                            type="button"
                            onClick={() => removeFromCart(variantId)}
                            aria-label={`Reduce ${variant.foodName} quantity`}
                          >
                            &minus;
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => addToCart(variantId)}
                            aria-label={`Increase ${variant.foodName} quantity`}
                          >
                            +
                          </button>
                        </div>
                        <span className="cart-item-total">
                          ${total.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => handleClearItem(variantId, quantity)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="cart-summary">
          <div className="cart-summary-card">
            <h2>Order summary</h2>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="cart-checkout"
              onClick={() => navigate("/order")}
              disabled={cartEntries.length === 0}
            >
              Proceed to checkout
            </button>
          </div>

          <div className="cart-promocode">
            <p>Have a promo code?</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="Enter promo code" />
              <button type="button">Apply</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
