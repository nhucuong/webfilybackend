toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: "3000"
};


// CLOSE TICKET
document.querySelectorAll(".update-status").forEach(item => {
  item.addEventListener("click", async (e) => {
    e.preventDefault();

    const ticketId = item.dataset.id;
    const status = item.dataset.status;

    if (!ticketId || !status) {
        toastr.error("Ticket ID or status missing");
        return;
    }


    try {
      const res = await fetch(`/ticket/update-status/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (data.success) {
          toastr.success(data.message || "Ticket status updated");

        // Update status badge dynamically
        const badge = document.querySelector(".badge");
        badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

        // Change badge class based on status
        let badgeClass = "badge rounded-pill me-2 p-2 ";
        if (status === "open") badgeClass += "bg-success-subtle text-success border border-success-subtle";
        if (status === "answered") badgeClass += "bg-primary-subtle text-primary border border-primary-subtle";
        if (status === "closed") badgeClass += "bg-danger-subtle text-danger border border-danger-subtle";

        badge.className = badgeClass;

      } else {
         toastr.error(data.message || "Failed to update status");
      }

    } catch (err) {
      console.error(err);
      toastr.error("Server error");
    }
  });
});


// REPLY TO TICKET
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("ticketReplyForm");
  const messagesContainer = document.getElementById("ticketMessages");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        form.reset();
        const msg = data.newMessage;
        const ticketId = data.ticketId;

        const card = document.createElement("div");
        card.classList.add("card", "border-primary", "mb-3");

card.innerHTML = `
  <div class="card-body d-flex justify-content-between">
    <!-- Left side: Message content -->
    <div class="me-3 flex-grow-1">
      <h5 class="fw-bold">${msg.sender?.name || "Unknown"}</h5>
      <p class="text-muted mb-2">Posted on ${new Date(msg.createdAt).toLocaleString()}</p>
      <p>${msg.message}</p>
      ${
        msg.attachments && msg.attachments.length > 0
          ? `<strong>Attachments:</strong><br>${msg.attachments
              .map(
                (a) => `<a href="${a.url}" target="_blank" class="badge bg-info text-white mb-1 d-inline-block">View Attachment</a>`
              )
              .join('')}`
          : ''
      }
    </div>

    <!-- Right side: Delete button -->
    <div class="d-flex align-items-center border-start ps-3">
      <a href="/ticket/message/delete/${ticketId}/${msg._id}" class="btn btn-danger btn-sm">
        <i class="fas fa-trash me-2"></i>Delete
      </a>
    </div>
  </div>
`;


        messagesContainer.appendChild(card);
        // scroll to bottom after reply
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

               toastr.success("Reply sent successfully");

      } else {
          toastr.error(data.message || "Failed to submit reply");
        }
    } catch (err) {
      console.error("Reply AJAX Error:", err);
     toastr.error("Server error while submitting reply");
    }
  });

  // DELETE MESSAGE
  messagesContainer.addEventListener("click", async function (e) {
    const btn = e.target.closest(".btn-danger");
    if (!btn) return;
    e.preventDefault();

    const url = btn.getAttribute("href");

    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        btn.closest(".card").remove();
      } else {
        toastr.error(data.message || "Failed to delete message");
      }
    } catch (err) {
      console.error("Delete message error:", err);
      toastr.error("Something went wrong while deleting the message");
    }
  });

  

});

// REPLY TO TICKET
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("ticketReplyForm");
  const messagesContainer = document.getElementById("ticketMessages");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        form.reset();
          fileInput.value = "";
          selectedFilesDiv.innerHTML = "";
        const msg = data.newMessage;
        const ticketId = data.ticketId;

        const card = document.createElement("div");
        card.classList.add("card", "border-primary", "mb-3");

card.innerHTML = `
  <div class="card-body d-flex justify-content-between">
    <!-- Left side: Message content -->
    <div class="me-3 flex-grow-1">
      <h5 class="fw-bold">${msg.sender?.name || "Unknown"}</h5>
      <p class="text-muted mb-2">Posted on ${new Date(msg.createdAt).toLocaleString()}</p>
      <p>${msg.message}</p>
      ${
        msg.attachments && msg.attachments.length > 0
          ? `<strong>Attachments:</strong><br>${msg.attachments
              .map(
                (a) => `<a href="${a.url}" target="_blank" class="badge bg-info text-white mb-1 d-inline-block">View Attachment</a>`
              )
              .join('')}`
          : ''
      }
    </div>

    <!-- Right side: Delete button -->
    <div class="d-flex align-items-center border-start ps-3">
      <a href="/ticket/message/delete/${ticketId}/${msg._id}" class="btn btn-danger btn-sm">
        <i class="fas fa-trash me-2"></i>Delete
      </a>
    </div>
  </div>
`;


        messagesContainer.appendChild(card);
        // scroll to bottom after reply
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

               toastr.success("Reply sent successfully");

      } else {
          toastr.error(data.message || "Failed to submit reply");
        }
    } catch (err) {
      console.error("Reply AJAX Error:", err);
     toastr.error("Server error while submitting reply");
    }
  });

  // DELETE MESSAGE
  messagesContainer.addEventListener("click", async function (e) {
    const btn = e.target.closest(".btn-danger");
    if (!btn) return;
    e.preventDefault();

    const url = btn.getAttribute("href");

    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        btn.closest(".card").remove();
      } else {
        toastr.error(data.message || "Failed to delete message");
      }
    } catch (err) {
      console.error("Delete message error:", err);
      toastr.error("Something went wrong while deleting the message");
    }
  });

const fileInput = document.getElementById("attachmentInput");
const selectedFilesDiv = document.getElementById("selectedFiles");

fileInput.addEventListener("change", function () {
  selectedFilesDiv.innerHTML = "";

  if (!this.files.length) return;

  Array.from(this.files).forEach(file => {

    const wrapper = document.createElement("div");
    wrapper.className = "border rounded p-2 text-center position-relative";
    wrapper.style.width = "90px";

    const ext = file.name.split('.').pop().toLowerCase();

    // ✅ IMAGE PREVIEW
    if (["jpg", "jpeg", "png"].includes(ext)) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "70px";
      img.style.height = "70px";
      img.style.objectFit = "cover";
      img.className = "mb-1 rounded";
      wrapper.appendChild(img);

    } 
    // ✅ PDF ICON
    else if (ext === "pdf") {
      wrapper.innerHTML += `<i class="fas fa-file-pdf fa-2x text-danger mb-1"></i>`;
    } 
    // ✅ DOC ICON
    else if (["doc", "docx"].includes(ext)) {
      wrapper.innerHTML += `<i class="fas fa-file-word fa-2x text-primary mb-1"></i>`;
    } 
    // ✅ OTHER FILE
    else {
      wrapper.innerHTML += `<i class="fas fa-file fa-2x text-secondary mb-1"></i>`;
    }

    const fileName = document.createElement("div");
    fileName.className = "small text-truncate";
    fileName.title = file.name;
    fileName.textContent = file.name;

    wrapper.appendChild(fileName);
    selectedFilesDiv.appendChild(wrapper);
  });
});

});

