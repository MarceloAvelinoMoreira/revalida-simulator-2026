// App bootstrap — REVALIDDA Simulator
document.addEventListener("DOMContentLoaded", function () {
  if (typeof updateStartBtn === "function") updateStartBtn();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(function () {});
  }
});
