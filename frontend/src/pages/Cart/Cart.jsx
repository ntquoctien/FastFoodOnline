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

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Variant</p>
          <p>Branch</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {cartEntries.map(([variantId, quantity]) => {
          const variant = variantMap[variantId];
          if (!variant) return null;
          const price = variant.price;
          const total = price * quantity;
          const imageSrc = variant.foodImage
            ? `${url}/images/${variant.foodImage}`
            : assets.placeholder_image;
          return (
            <div key={variantId}>
              <div className="cart-items-title cart-items-item">
                <img src={imageSrc} alt={variant.foodName} />
                <p>{variant.foodName}</p>
                <p>{variant.size}</p>
                 <p>{variant.branchName || "Branch"}</p>
                <p>${price.toFixed(2)}</p>
                <p>{quantity}</p>
                <p>${total.toFixed(2)}</p>
                <p onClick={() => removeFromCart(variantId)} className="cross">
                  x
                </p>
              </div>
              <hr />
            </div>
          );
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotals</p>
              <p>${getTotalCartAmount().toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                $
                {getTotalCartAmount() === 0
                  ? 0
                  : (getTotalCartAmount() + 2).toFixed(2)}
              </b>
            </div>
          </div>
          <button onClick={() => navigate("/order")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promocode, Enter it here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="promo code" />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
