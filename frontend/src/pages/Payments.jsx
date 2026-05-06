import "../index.css";

export default function Payments() {
  const payments = [
    {
      project: "Portfolio Website",
      amount: "$250",
      status: "Paid",
    },
    {
      project: "Chat Application",
      amount: "$700",
      status: "Pending",
    },
  ];

  return (
    <div className="page-container">

      <div className="page-header">
        <h1>💳 Payments</h1>
        <p>Track all payment transactions</p>
      </div>

      <div className="payment-table">

        <div className="table-head">
          <span>Project</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {payments.map((pay, index) => (
          <div className="table-row" key={index}>

            <span>{pay.project}</span>

            <span>{pay.amount}</span>

            <span className={pay.status.toLowerCase()}>
              {pay.status}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}