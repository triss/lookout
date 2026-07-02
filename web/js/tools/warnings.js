// Battery / disk warning chips shown in the tool HUDs. Expects elements
// #warnBattery and #warnDisk (hidden by default). DOM-coupled; shared by all
// the full-screen tools.
export async function initWarnings() {
  const warnBattery = document.getElementById("warnBattery");
  const warnDisk = document.getElementById("warnDisk");
  try {
    const bat = await navigator.getBattery?.();
    if (bat && warnBattery) {
      const upd = () => {
        const low = bat.level < 0.15 && !bat.charging;
        warnBattery.hidden = !low;
        warnBattery.textContent = `🔋 ${Math.round(bat.level * 100)}%`;
      };
      bat.addEventListener("levelchange", upd);
      bat.addEventListener("chargingchange", upd);
      upd();
    }
  } catch (e) { /* no battery API */ }
  if (navigator.storage?.estimate && warnDisk) {
    const { usage, quota } = await navigator.storage.estimate();
    if (quota && usage / quota > 0.9) {
      warnDisk.hidden = false;
      warnDisk.textContent = "💾 storage low";
    }
  }
}
