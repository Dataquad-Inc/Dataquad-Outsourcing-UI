import { useSelector } from "react-redux";
import { addtoPlacementHandler, addtoUsPlacementHandler } from "../redux/commonSlice";
import axios from "axios";

export const validateIfPlaced = async(interviewStatus, data, dispatch, isUs) => {
      if(interviewStatus === "Placed" || interviewStatus === "PLACED" || interviewStatus === "placed") {
        if(isUs) {
        dispatch(addtoUsPlacementHandler(data));
        }else{
        dispatch(addtoPlacementHandler(data));
      }
      }
      return;
}
