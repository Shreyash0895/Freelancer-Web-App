import { useEffect, useState } from "react";
import API from "../api/api";

export default function BidList({ projectId }) {
  const [bids, setBids] = useState([]);

  useEffect(() => {
    API.get(`/bids/${projectId}`).then(res => setBids(res.data));
  }, [projectId]);

  const accept = async (b) => {
    await API.post("/accept-bid", {
      projectId,
      freelancerEmail: b.freelancerEmail,
    });
    alert("Accepted");
  };

  return (
    <div>
      {bids.map((b, i) => (
        <div key={i}>
          <p>{b.price}</p>
          <p>{b.message}</p>
          <button onClick={()=>accept(b)}>Accept</button>
        </div>
      ))}
    </div>
  );
}