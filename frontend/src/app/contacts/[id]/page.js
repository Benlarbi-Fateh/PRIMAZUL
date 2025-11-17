"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/api";

export default function ContactDetailsPage() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await axios.get(`/users/${id}`);
        setContact(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  if (loading)
    return (
      <p className="p-6 text-center text-lg text-gray-700">Loading...</p>
    );

  if (!contact)
    return (
      <p className="p-6 text-center text-lg text-red-500">Contact not found</p>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-6">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-md p-8 relative">
        {/* Profile Image */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={contact.profilePicture || "https://via.placeholder.com/150"}
              alt="profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
            {/* Online Badge */}
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${
                contact.isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              title={contact.isOnline ? "Online" : "Offline"}
            ></span>
          </div>
        </div>

        {/* Name & Status */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {contact.username}
          </h1>
          <p className="text-gray-500 mt-1">{contact.statusMessage}</p>
        </div>

        {/* Contact Info */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Email:</span>
            <span className="text-gray-500">{contact.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Phone:</span>
            <span className="text-gray-500">{contact.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Registered:</span>
            <span className="text-gray-500">{contact["dateD'inscription"]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Last Seen:</span>
            <span className="text-gray-500">{contact.lastSeen}</span>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <a
            href="/contacts"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
          >
            Back to Contacts
          </a>
        </div>
      </div>
    </div>
  );
}
