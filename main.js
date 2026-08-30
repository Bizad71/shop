import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { Html5Qrcode } from "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/+esm";

const SUPABASE_URL = "https://rellsmuqjhcfhenjkbxa.supabase.co";
const SUPABASE_KEY = "sb_publishable_PRT5-T0k-_AiSvy6lrJV-g_r7wLQjRk";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const app = document.getElementById("app");

let profile = null;
let shop = null;
let scanner = null;

/* =========================
   ورود اولیه
========================= */

const START_USERNAME = "Bizad";
const START_PASSWORD = "Bizad0111";

/* =========================
   ابزارها
========================= */

function money(value) {
  return new Intl.NumberFormat("fa-IR").format(
    Number(value || 0)
  );
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message, error = false) {
  const old = document.querySelector(".toast");

  if (old) {
    old.remove();
  }

  const box = document.createElement("div");

  box.className = error
    ? "toast toast-error"
    : "toast";

  box.textContent = message;

  document.body.appendChild(box);

  setTimeout(() => {
    box.remove();
  }, 3000);
}

/* =========================
   صفحه ورود
========================= */

function showLogin() {
  app.innerHTML = `

    <div class="login-page">

      <div class="login-box">

        <div class="logo">
          B
        </div>

        <h1>
          BizadShop
        </h1>

        <p>
          سیستم فروش و مدیریت انبار
        </p>

        <form id="loginForm">

          <label>
            نام کاربری
          </label>

          <input
            id="username"
            type="text"
            placeholder="نام کاربری"
            autocomplete="username"
            required
          >

          <label>
            رمز عبور
          </label>

          <input
            id="password"
            type="password"
            placeholder="رمز عبور"
            autocomplete="current-password"
            required
          >

          <button
            type="submit"
            class="btn-primary"
          >
            ورود
          </button>

          <div
            id="loginError"
            class="login-error"
          ></div>

        </form>

      </div>

    </div>

  `;

  document
    .getElementById("loginForm")
    .addEventListener("submit", login);
}

/* =========================
   ورود
========================= */

async function login(event) {
  event.preventDefault();

  const username =
    document
      .getElementById("username")
      .value
      .trim();

  const password =
    document
      .getElementById("password")
      .value;

  const errorBox =
    document.getElementById("loginError");

  errorBox.textContent = "";

  if (
    username !== START_USERNAME ||
    password !== START_PASSWORD
  ) {
    errorBox.textContent =
      "نام کاربری یا رمز عبور اشتباه است.";

    return;
  }

  try {

    /*
      کاربر واقعی Supabase
      در جدول profiles با نام admin است.
    */

    const {
      data,
      error
    } =
      await supabase.rpc(
        "get_login_email",
        {
          p_username: "admin"
        }
      );

    if (error || !data) {

      console.error(error);

      errorBox.textContent =
        "ایمیل کاربر پیدا نشد.";

      return;
    }

    const email = data;

    const {
      error: loginError
    } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (loginError) {

      console.error(loginError);

      errorBox.textContent =
        "ورود به حساب Supabase انجام نشد.";

      return;
    }

    await loadUser();

  }

  catch (error) {

    console.error(error);

    errorBox.textContent =
      "خطا در ورود به سیستم.";

  }
}

/* =========================
   دریافت اطلاعات کاربر
========================= */

async function loadUser() {

  const {
    data: userData,
    error
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !userData.user
  ) {

    showLogin();

    return;
  }

  const user =
    userData.user;

  const {
    data: profileData,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (profileError) {

    console.error(profileError);

    toast(
      "پروفایل کاربر پیدا نشد.",
      true
    );

    await supabase.auth.signOut();

    showLogin();

    return;
  }

  profile = profileData;

  const {
    data: shopData,
    error: shopError
  } =
    await supabase
      .from("shops")
      .select("*")
      .eq("id", profile.shop_id)
      .single();

  if (shopError) {

    console.error(shopError);

    toast(
      "فروشگاه پیدا نشد.",
      true
    );

    return;
  }

  shop = shopData;

  showHome();
}

/* =========================
   قالب اصلی سایت
========================= */

function layout(content) {

  app.innerHTML = `

    <div class="app">

      <header class="header">

        <div>

          <div class="brand">
            BizadShop
          </div>

          <div class="shop-title">
            ${escapeHTML(shop?.name)}
          </div>

        </div>

        <div class="header-user">

          <span>
            ${escapeHTML(profile?.username)}
          </span>

          <button
            id="logoutButton"
            class="logout"
          >
            خروج
          </button>

        </div>

      </header>

      <main class="content">

        ${content}

      </main>

      <nav class="bottom-menu">

        <button
          data-page="sale"
          class="active"
        >
          🛒
          <span>
            فروش
          </span>
        </button>

        <button
          data-page="receive"
        >
          📦
          <span>
            ورود کالا
          </span>
        </button>

        <button
          data-page="inventory"
        >
          📋
          <span>
            موجودی
          </span>
        </button>

      </nav>

      <button
        id="inventoryButton"
        class="floating-inventory"
      >
        📦

        <small>
          انبار
        </small>

      </button>

    </div>

  `;

  document
    .getElementById("logoutButton")
    .onclick = logout;

  document
    .getElementById("inventoryButton")
    .onclick = showReceive;

  document
    .querySelectorAll("[data-page]")
    .forEach(button => {

      button.onclick = () => {

        const page =
          button.dataset.page;

        if (page === "sale") {
          showHome();
        }

        if (page === "receive") {
          showReceive();
        }

        if (page === "inventory") {
          showInventory();
        }

      };

    });

}

/* =========================
   خروج
========================= */

async function logout() {

  await closeScanner();

  await supabase.auth.signOut();

  profile = null;
  shop = null;

  showLogin();
}

/* =========================
   صفحه فروش
========================= */

function showHome() {

  layout(`

    <section class="welcome">

      <div>

        <span class="badge">
          فروش
        </span>

        <h1>
          ثبت فروش
        </h1>

        <p>
          بارکد کالا را اسکن کن
          یا به صورت دستی وارد کن.
        </p>

      </div>

      <button
        id="scanSale"
        class="scan-button"
      >

        📷

        <small>
          اسکن بارکد
        </small>

      </button>

    </section>

    <section class="card">

      <h2>
        جستجوی کالا
      </h2>

      <div class="search-row">

        <input
          id="saleBarcode"
          placeholder="بارکد کالا"
          inputmode="numeric"
        >

        <button
          id="searchSale"
          class="btn-primary"
        >
          جستجو
        </button>

      </div>

      <div id="saleResult"></div>

    </section>

    <section
      id="saleScanner"
      class="card hidden"
    >

      <div class="card-header">

        <h2>
          اسکن بارکد
        </h2>

        <button
          id="closeSaleScanner"
          class="btn-light"
        >
          بستن
        </button>

      </div>

      <div
        id="sale-reader"
        class="reader"
      ></div>

    </section>

  `);

  document
    .getElementById("searchSale")
    .onclick = () =>
      searchProduct("sale");

  document
    .getElementById("saleBarcode")
    .addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          searchProduct("sale");
        }

      }
    );

  document
    .getElementById("scanSale")
    .onclick = () =>
      openScanner("sale");

  document
    .getElementById("closeSaleScanner")
    .onclick = () =>
      closeScanner();
}

/* =========================
   جستجوی کالا
========================= */

async function searchProduct(
  mode,
  barcode = null
) {

  const input =
    document.getElementById(
      mode === "sale"
        ? "saleBarcode"
        : "receiveBarcode"
    );

  const code =
    barcode ||
    input?.value.trim();

  if (!code) {

    toast(
      "بارکد را وارد کن.",
      true
    );

    return;
  }

  const {
    data,
    error
  } =
    await supabase
      .from("products")
      .select(`
        id,
        shop_id,
        barcode,
        name,
        stock,
        price1,
        price2
      `)
      .eq("barcode", code)
      .maybeSingle();

  if (error) {

    console.error(error);

    toast(
      "خطا در جستجوی کالا.",
      true
    );

    return;
  }

  if (!data) {

    if (mode === "receive") {
      showNewProduct(code);
      return;
    }

    toast(
      "کالا پیدا نشد.",
      true
    );

    return;
  }

  if (mode === "sale") {
    showSaleProduct(data);
  }
  else {
    showReceiveProduct(data);
  }
}

/* =========================
   نمایش کالای فروش
========================= */

function showSaleProduct(product) {

  const result =
    document.getElementById(
      "saleResult"
    );

  const prices = [];

  if (
    product.price1 !== null &&
    product.price1 !== undefined
  ) {
    prices.push(product.price1);
  }

  if (
    product.price2 !== null &&
    product.price2 !== undefined
  ) {
    prices.push(product.price2);
  }

  result.innerHTML = `

    <div class="product-box">

      <div class="product-top">

        <span>
          بارکد:
          ${escapeHTML(product.barcode)}
        </span>

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <p>
          موجودی:
          <strong>
            ${money(product.stock)}
          </strong>
        </p>

      </div>

      <h4>
        انتخاب قیمت
      </h4>

      <div class="price-options">

        ${prices.map(
          (price, index) => `

            <button
              class="price-option ${
                index === 0
                  ? "selected"
                  : ""
              }"
              data-price="${price}"
            >

              <span>
                قیمت ${index + 1}
              </span>

              <strong>
                ${money(price)}
                تومان
              </strong>

            </button>

          `
        ).join("")}

      </div>

      <label>
        تعداد فروش
      </label>

      <input
        id="saleQuantity"
        type="number"
        min="1"
        value="1"
      >

      <button
        id="confirmSale"
        class="btn-primary full"
      >
        ثبت فروش
      </button>

    </div>

  `;

  document
    .querySelectorAll(".price-option")
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(".price-option")
          .forEach(
            b =>
              b.classList.remove(
                "selected"
              )
          );

        button.classList.add(
          "selected"
        );

      };

    });

  document
    .getElementById("confirmSale")
    .onclick = async () => {

      const quantity =
        Number(
          document
            .getElementById(
              "saleQuantity"
            )
            .value
        );

      const selected =
        document.querySelector(
          ".price-option.selected"
        );

      if (!selected) {

        toast(
          "یک قیمت انتخاب کن.",
          true
        );

        return;
      }

      const price =
        Number(
          selected.dataset.price
        );

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        toast(
          "تعداد صحیح وارد کن.",
          true
        );

        return;
      }

      if (
        quantity > product.stock
      ) {

        toast(
          "موجودی کافی نیست.",
          true
        );

        return;
      }

      const {
        error
      } =
        await supabase.rpc(
          "register_sale",
          {
            p_product_id:
              product.id,

            p_qty:
              quantity,

            p_unit_price:
              price
          }
        );

      if (error) {

        console.error(error);

        toast(
          error.message ||
          "ثبت فروش انجام نشد.",
          true
        );

        return;
      }

      toast(
        "فروش با موفقیت ثبت شد."
      );

      showHome();

    };

}

/* =========================
   صفحه ورود کالا
========================= */

function showReceive() {

  layout(`

    <section class="welcome">

      <div>

        <span class="badge">
          انبار
        </span>

        <h1>
          ورود کالا
        </h1>

        <p>
          کالای جدید را ثبت کن
          یا موجودی کالای قبلی را افزایش بده.
        </p>

      </div>

      <button
        id="scanReceive"
        class="scan-button"
      >

        📷

        <small>
          اسکن بارکد
        </small>

      </button>

    </section>

    <section class="card">

      <h2>
        بارکد کالا
      </h2>

      <div class="search-row">

        <input
          id="receiveBarcode"
          placeholder="بارکد کالا"
          inputmode="numeric"
        >

        <button
          id="searchReceive"
          class="btn-primary"
        >
          جستجو
        </button>

      </div>

      <div
        id="receiveResult"
      ></div>

    </section>

    <section
      id="receiveScanner"
      class="card hidden"
    >

      <div class="card-header">

        <h2>
          اسکن بارکد
        </h2>

        <button
          id="closeReceiveScanner"
          class="btn-light"
        >
          بستن
        </button>

      </div>

      <div
        id="receive-reader"
        class="reader"
      ></div>

    </section>

  `);

  document
    .getElementById("searchReceive")
    .onclick = () =>
      searchProduct("receive");

  document
    .getElementById("receiveBarcode")
    .addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          searchProduct("receive");
        }

      }
    );

  document
    .getElementById("scanReceive")
    .onclick = () =>
      openScanner("receive");

  document
    .getElementById("closeReceiveScanner")
    .onclick = () =>
      closeScanner();
}

/* =========================
   کالای موجود
========================= */

function showReceiveProduct(product) {

  const result =
    document.getElementById(
      "receiveResult"
    );

  result.innerHTML = `

    <div class="product-box">

      <span>
        بارکد:
        ${escapeHTML(product.barcode)}
      </span>

      <h3>
        ${escapeHTML(product.name)}
      </h3>

      <p>
        موجودی فعلی:
        <strong>
          ${money(product.stock)}
        </strong>
      </p>

      <label>
        تعداد ورود
      </label>

      <input
        id="receiveQuantity"
        type="number"
        min="1"
        value="1"
      >

      <label>
        قیمت اول
      </label>

      <input
        id="receivePrice1"
        type="number"
        min="0"
        value="${product.price1 ?? ""}"
      >

      <label>
        قیمت دوم
        <small>
          اختیاری
        </small>
      </label>

      <input
        id="receivePrice2"
        type="number"
        min="0"
        value="${
          product.price2 ?? ""
        }"
      >

      <button
        id="confirmReceive"
        class="btn-primary full"
      >
        ثبت ورود به انبار
      </button>

    </div>

  `;

  document
    .getElementById(
      "confirmReceive"
    )
    .onclick =
    async () => {

      const quantity =
        Number(
          document
            .getElementById(
              "receiveQuantity"
            )
            .value
        );

      const price1 =
        Number(
          document
            .getElementById(
              "receivePrice1"
            )
            .value
        );

      const price2Value =
        document
          .getElementById(
            "receivePrice2"
          )
          .value;

      const price2 =
        price2Value === ""
          ? null
          : Number(price2Value);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        toast(
          "تعداد نامعتبر است.",
          true
        );

        return;
      }

      if (
        !Number.isFinite(price1) ||
        price1 < 0
      ) {

        toast(
          "قیمت اول نامعتبر است.",
          true
        );

        return;
      }

      if (
        price2 !== null &&
        (
          !Number.isFinite(price2) ||
          price2 < 0
        )
      ) {

        toast(
          "قیمت دوم نامعتبر است.",
          true
        );

        return;
      }

      const {
        error
      } =
        await supabase.rpc(
          "receive_stock",
          {
            p_product_id:
              product.id,

            p_qty:
              quantity,

            p_price1:
              price1,

            p_price2:
              price2
          }
        );

      if (error) {

        console.error(error);

        toast(
          error.message ||
          "ورود کالا انجام نشد.",
          true
        );

        return;
      }

      toast(
        "کالا وارد انبار شد."
      );

      showReceive();
    };
}

/* =========================
   کالای جدید
========================= */

function showNewProduct(barcode) {

  const result =
    document.getElementById(
      "receiveResult"
    );

  result.innerHTML = `

    <div class="product-box">

      <span>
        بارکد جدید:
        ${escapeHTML(barcode)}
      </span>

      <h3>
        ثبت کالای جدید
      </h3>

      <label>
        نام کالا
      </label>

      <input
        id="newProductName"
        placeholder="نام کالا"
      >

      <label>
        تعداد
      </label>

      <input
        id="newProductQuantity"
        type="number"
        min="1"
        value="1"
      >

      <label>
        قیمت اول
      </label>

      <input
        id="newProductPrice1"
        type="number"
        min="0"
        placeholder="قیمت"
      >

      <label>
        قیمت دوم
        <small>
          اختیاری
        </small>
      </label>

      <input
        id="newProductPrice2"
        type="number"
        min="0"
        placeholder="قیمت دوم"
      >

      <button
        id="createProduct"
        class="btn-primary full"
      >
        ثبت کالا
      </button>

    </div>

  `;

  document
    .getElementById(
      "createProduct"
    )
    .onclick =
    async () => {

      const name =
        document
          .getElementById(
            "newProductName"
          )
          .value
          .trim();

      const quantity =
        Number(
          document
            .getElementById(
              "newProductQuantity"
            )
            .value
        );

      const price1Value =
        document
          .getElementById(
            "newProductPrice1"
          )
          .value;

      const price1 =
        price1Value === ""
          ? 0
          : Number(price1Value);

      const price2Value =
        document
          .getElementById(
            "newProductPrice2"
          )
          .value;

      const price2 =
        price2Value === ""
          ? null
          : Number(price2Value);

      if (!name) {

        toast(
          "نام کالا را وارد کن.",
          true
        );

        return;
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        toast(
          "تعداد نامعتبر است.",
          true
        );

        return;
      }

      if (
        !Number.isFinite(price1) ||
        price1 < 0
      ) {

        toast(
          "قیمت اول نامعتبر است.",
          true
        );

        return;
      }

      if (
        price2 !== null &&
        (
          !Number.isFinite(price2) ||
          price2 < 0
        )
      ) {

        toast(
          "قیمت دوم نامعتبر است.",
          true
        );

        return;
      }

      const {
        error
      } =
        await supabase.rpc(
          "create_product_with_stock",
          {
            p_barcode:
              barcode,

            p_name:
              name,

            p_qty:
              quantity,

            p_price1:
              price1,

            p_price2:
              price2
          }
        );

      if (error) {

        console.error(error);

        toast(
          error.message ||
          "ثبت کالا انجام نشد.",
          true
        );

        return;
      }

      toast(
        "کالا با موفقیت ثبت شد."
      );

      showReceive();
    };
}

/* =========================
   موجودی
========================= */

async function showInventory() {

  layout(`

    <section class="card">

      <div class="card-header">

        <h1>
          موجودی انبار
        </h1>

        <button
          id="refreshInventory"
          class="btn-light"
        >
          بروزرسانی
        </button>

      </div>

      <div
        id="inventoryList"
        class="inventory-list"
      >
        در حال دریافت...
      </div>

    </section>

  `);

  const {
    data,
    error
  } =
    await supabase
      .from("products")
      .select(`
        id,
        name,
        barcode,
        stock,
        price1,
        price2
      `)
      .order("name");

  const list =
    document.getElementById(
      "inventoryList"
    );

  if (error) {

    console.error(error);

    list.textContent =
      "خطا در دریافت موجودی.";

    return;
  }

  if (!data || !data.length) {

    list.textContent =
      "هنوز کالایی ثبت نشده.";

    document
      .getElementById(
        "refreshInventory"
      )
      .onclick =
      showInventory;

    return;
  }

  list.innerHTML =
    data.map(
      product => `

        <div class="inventory-item">

          <div>

            <strong>
              ${escapeHTML(
                product.name
              )}
            </strong>

            <small>
              ${escapeHTML(
                product.barcode
              )}
            </small>

          </div>

          <div class="stock">

            موجودی:
            ${money(
              product.stock
            )}

          </div>

          <div class="prices">

            ${money(
              product.price1
            )}

            ${
              product.price2 !== null
                ? `
                  <br>
                  ${money(
                    product.price2
                  )}
                `
                : ""
            }

          </div>

        </div>

      `
    )
    .join("");

  document
    .getElementById(
      "refreshInventory"
    )
    .onclick =
    showInventory;
}

/* =========================
   اسکن دوربین
========================= */

async function openScanner(mode) {

  await closeScanner();

  const section =
    document.getElementById(
      mode === "sale"
        ? "saleScanner"
        : "receiveScanner"
    );

  if (!section) {
    return;
  }

  section.classList.remove(
    "hidden"
  );

  const readerId =
    mode === "sale"
      ? "sale-reader"
      : "receive-reader";

  scanner =
    new Html5Qrcode(
      readerId
    );

  try {

    await scanner.start(

      {
        facingMode:
          "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 280,
          height: 140
        }
      },

      async decodedText => {

        const code =
          decodedText.trim();

        await closeScanner();

        const input =
          document.getElementById(
            mode === "sale"
              ? "saleBarcode"
              : "receiveBarcode"
          );

        if (input) {
          input.value = code;
        }

        await searchProduct(
          mode,
          code
        );
      },

      () => {}

    );

  }

  catch (error) {

    console.error(error);

    toast(
      "دسترسی دوربین فعال نیست.",
      true
    );

    scanner = null;
  }
}

/* =========================
   بستن اسکنر
========================= */

async function closeScanner() {

  if (scanner) {

    try {
      await scanner.stop();
    }
    catch (error) {
      console.error(error);
    }

    try {
      await scanner.clear();
    }
    catch (error) {
      console.error(error);
    }

    scanner = null;
  }

  document
    .querySelectorAll(
      ".reader"
    )
    .forEach(
      reader => {
        reader.innerHTML = "";
      }
    );
}

/* =========================
   شروع برنامه
========================= */

async function startApp() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();

    if (error) {

      console.error(error);

      showLogin();

      return;
    }

    if (data.session) {

      await loadUser();

    }
    else {

      showLogin();

    }

  }

  catch (error) {

    console.error(error);

    showLogin();
  }
}

startApp();
