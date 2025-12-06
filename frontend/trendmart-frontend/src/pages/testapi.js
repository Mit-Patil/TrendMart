import React, { useEffect, useState } from "react";
import api from "../services/api";

function TestApi() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/Cart")
      .then(res => setData(res.data))
      .catch(err => console.error("API Error:", err));
  }, []);

  return (
    <div className="container">
      <h2>API Connection Test</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default TestApi;
