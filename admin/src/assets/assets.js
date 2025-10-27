import logo from './logo.png'
import add_icon from './add_icon.png'
import order_icon from './order_icon.png'
import profile_image from './profile_image.png'
import upload_area from './upload_area.png'
import parcel_icon from './parcel_icon.png'
import chevron_right from './right-arrow.png'

export const assets ={
    logo,
    add_icon,
    order_icon,
    profile_image,
    upload_area,
    parcel_icon,
    chevron_right
}

export const apiBaseUrl =
  import.meta.env.VITE_API_URL || "https://food-delivery-backend-5b6g.onrender.com";
export const url = apiBaseUrl;
