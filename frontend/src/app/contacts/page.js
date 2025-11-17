"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "@/lib/api";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get("/users");
        setContacts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-xl text-gray-700">
        Loading contacts...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Contacts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map((contact) => (
          <div
            key={contact._id}
            className="bg-white rounded-2xl shadow hover:shadow-lg p-5 flex flex-col gap-4 transition-all cursor-pointer border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <img
                src={contact.profilePicture || "https://via.placeholder.com/80"}
                alt="profile"
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
              />

              <div className="flex flex-col">
                <p className="text-lg font-semibold text-gray-900">
                  {contact.username}
                </p>
                <p className="text-gray-500 text-sm line-clamp-1">
                  {contact.statusMessage}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      contact.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {contact.isOnline
                      ? "Online"
                      : `Last seen: ${contact.lastSeen}`}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/contacts/${contact._id}`}
              className="mt-3 bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 w-fit"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
