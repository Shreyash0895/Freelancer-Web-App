import { useState } from "react";
import API from "../api/api";

export default function BidForm({ projectId }) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const email = localStorage.getItem("email");

  const submit = async () => {
    await API.post("/bid", {
      projectId,
      freelancerEmail: email,
      price,
      message,
    });
    alert("Bid sent");
  };

  return (
    <div>
      <input placeholder="Price" onChange={(e)=>setPrice(e.target.value)} />
      <input placeholder="Message" onChange={(e)=>setMessage(e.target.value)} />
      <button onClick={submit}>Bid</button>
    </div>
  );
}