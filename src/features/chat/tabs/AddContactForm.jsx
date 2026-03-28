import React, { useState, useEffect } from "react";
import { useAddContactMutation, useUpdateContactMutation } from "../../../api/contactApi";
import { Button } from "@mui/material";
import Input from "../../../components/ui/Input";
import { Person, Call } from "@mui/icons-material";
import toast from "react-hot-toast";

export default function AddContactForm({ contactToEdit, onSaved }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const [addContact, { isLoading: adding, error: addError }] = useAddContactMutation();
  const [updateContact, { isLoading: updating, error: updateError }] = useUpdateContactMutation();

  // Prefill form if editing a contact
  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name || "");
      setNumber(contactToEdit.number || "");
    }
  }, [contactToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !number.trim()) return;

    try {
      if (contactToEdit) {
        // Update existing contact
      const res =  await updateContact({ id: contactToEdit._id, name: name.trim(), number: number.trim() }).unwrap();
      toast.success(res.message || "Updated Contact")
        
      } else {
        // Add new contact
       const res = await addContact({ name: name.trim(), number: number.trim() }).unwrap();
      toast.success(res.message || "Added Contact")

      }

      setName("");
      setNumber("");
      if (onSaved) onSaved(); // callback to refetch contacts
    } catch (err) {
      console.error("Failed to save contact:", err);
      toast.error("Failed to save contact:", err)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-white rounded-lg w-full">
      <h2 className="text-lg font-semibold text-gray-800/70">
        {contactToEdit ? "Update Contact" : "Add New Contact"}
      </h2>

      <div className="relative w-full">
        <Person className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pl-10 rounded-md border-none bg-zinc-400/20"
        />
      </div>

      <div className="relative w-full">
        <Call className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <Input
          type="tel"
          placeholder="Phone Number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="pl-10 rounded-md border-none bg-zinc-400/20"
        />
      </div>

      {(addError || updateError) && (
        <p className="text-red-500 text-sm">
          {addError?.data?.message || updateError?.data?.message || "Something went wrong"}
        </p>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={adding || updating}
        className="self-center w-full"
      >
        {adding || updating ? "Saving..." : contactToEdit ? "Update" : "Save"}
      </Button>
    </form>
  );
}
