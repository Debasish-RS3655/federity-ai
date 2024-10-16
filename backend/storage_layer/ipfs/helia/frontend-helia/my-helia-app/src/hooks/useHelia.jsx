// creates a custom hook based on the Helia context that we just created
// Debashish Buragohain
import { useContext } from "react";
import { HeliaContext } from "../provider/HeliaProvider";

export const useHelia = () => {
    // need to use the useContext hook for using the context that we just created
    const { helia, fs, error, starting } = useContext(HeliaContext);
    return { helia, fs, error, starting };
}