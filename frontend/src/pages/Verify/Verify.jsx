import React, { useContext, useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from "react-toastify";

const Verify = () => {
    const [searchParams]=useSearchParams();
    const success=searchParams.get("success");
    const orderId=searchParams.get("orderId");
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const queryString = window.location.search.substring(1);
    const {url, setCartItems} =useContext(StoreContext);
    const navigate= useNavigate();

    const verifyPayment=async()=>{
        try{
            if(vnpResponseCode){
                const response = await axios.get(`${url}/api/v2/orders/pay/vnpay/verify?${queryString}`);
                if(response.data.success){
                    setCartItems({});
                    sessionStorage.removeItem("pendingOrderId");
                    toast.success("VNPAY payment successful");
                    navigate("/myorders");
                }else{
                    sessionStorage.removeItem("pendingOrderId");
                    toast.error(response.data.message || "VNPAY payment failed");
                    navigate("/order");
                }
                return;
            }
            if(success!==null && orderId){
                const response= await axios.post(url+"/api/order/verify",{success,orderId});
                if(response.data.success){
                    setCartItems({});
                    toast.success("Order Placed Successfully");
                    navigate("/myorders");
                }else{
                    toast.error("Something went wrong");
                    navigate("/");
                }
                return;
            }
            toast.error("Payment session not found");
            navigate("/");
        }catch(error){
            toast.error("Unable to verify payment");
            navigate("/");
        }
    }
    useEffect(()=>{
        verifyPayment();
    },[])
  return (
    <div className='verify'>
        <div className="spinner"></div>
    </div>
  )
}

export default Verify

