import { getPhoneNumber } from "../utils/crm";

const DEFAULT_WHATSAPP_MESSAGE =
  "Hello, this is regarding your inquiry with us.";

function cleanPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || "").replace(/\s/g, "");
  const digits = value.replace(/\D/g, "");

  return value.startsWith("+") ? `+${digits}` : digits;
}

function getWhatsAppNumber(phoneNumber) {
  const cleanNumber = cleanPhoneNumber(phoneNumber).replace(/\D/g, "");

  if (!cleanNumber) {
    return "";
  }

  return cleanNumber;
}

function ContactActions({ lead }) {
  const phoneNumber = getPhoneNumber(lead);
  const callNumber = cleanPhoneNumber(phoneNumber);
  const whatsappNumber = getWhatsAppNumber(phoneNumber);

  if (!callNumber) {
    return <p className="text-sm text-slate-500">No phone number</p>;
  }

  const handleCall = () => {
    window.location.href = `tel:${callNumber}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={handleCall}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
      >
        Call
      </button>
      <button
        type="button"
        onClick={handleWhatsApp}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        WhatsApp
      </button>
    </div>
  );
}

export default ContactActions;
