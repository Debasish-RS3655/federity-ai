import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <>
            <Link to={"/auth"}>Go to login</Link>
            <h3>The link you followed may be broken or this page isn't available</h3>
        </>
    )
}