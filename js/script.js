    function toggleMenu() {
      const menu = document.getElementById("menuLateral");
      const content = document.querySelector(".content");

      if (menu.style.width === "250px") {
        menu.style.width = "0";
        content.style.marginLeft = "0";
      } else {
        menu.style.width = "250px";
        content.style.marginLeft = "250px";
      }
    }

    function toggleSubmenu(id) {
      const submenu = document.getElementById(id);
      submenu.style.display = submenu.style.display === "block" ? "none" : "block";
    }

    document.getElementById("searchInput").addEventListener("input", function() {
      const filter = this.value.toLowerCase();
      const cards = document.querySelectorAll("#catalogo .card");

      cards.forEach(card => {
        const title = card.querySelector("a").textContent.toLowerCase();
        card.style.display = title.includes(filter) ? "flex" : "none";
      });
    });
