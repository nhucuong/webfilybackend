
  const filterSelect = document.getElementById("paymentFilter");
  const customContainer = document.getElementById("customDateContainer");
  const startInput = document.getElementById("customStart");
  const endInput = document.getElementById("customEnd");
  const filterDisplay = document.getElementById("filterDisplay");

  function updateFilterText() {
    const selectedFilter = filterSelect.value;
    if (selectedFilter === "custom") {
      const start = startInput.value;
      const end = endInput.value;
      filterDisplay.textContent =  "";
    } else if (selectedFilter === "today") {
      filterDisplay.textContent = "Today's Data";
    } else if (selectedFilter === "yesterday") {
      filterDisplay.textContent = "Yesterday's Data";
    } else if (selectedFilter === "week") {
      filterDisplay.textContent = "This Week Data";
    } else if (selectedFilter === "lastMonth") {
      filterDisplay.textContent = "Last Month Data";
    } else {
      filterDisplay.textContent = `${new Date().getFullYear()} Yearly Payments`;
    }
  }

  filterSelect.addEventListener("change", () => {
    const selectedFilter = filterSelect.value;
    if (selectedFilter === "custom") {
      customContainer.classList.remove("d-none");
      customContainer.classList.add("d-flex");
    } else {
      customContainer.classList.add("d-none");
      customContainer.classList.remove("d-flex");
    }
    updateFilterText();
  });

  // Update when custom dates change
  startInput.addEventListener("input", updateFilterText);
  endInput.addEventListener("input", updateFilterText);
