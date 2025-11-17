import React, { useState } from "react";
import axios from "axios";

const AddContact = () => {
  const [ownerId, setOwnerId] = useState(""); // ID du propriétaire
  const [contactUserId, setContactUserId] = useState(""); // ID du contact
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ownerId || !contactUserId) {
      setMessage("OwnerId et ContactUserId sont requis !");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/contacts/add", // ton URL backend
        { ownerId, contactUserId, nickname }
      );
      setMessage("Contact ajouté avec succès !");
      setOwnerId("");
      setContactUserId("");
      setNickname("");
      console.log(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Erreur lors de l'ajout du contact");
      }
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>Ajouter un contact</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Owner ID :</label>
          <input
            type="text"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="ID du propriétaire"
          />
        </div>
        <div>
          <label>Contact User ID :</label>
          <input
            type="text"
            value={contactUserId}
            onChange={(e) => setContactUserId(e.target.value)}
            placeholder="ID du contact"
          />
        </div>
        <div>
          <label>Surnom :</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Surnom facultatif"
          />
        </div>
        <button type="submit">Ajouter</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddContact;
