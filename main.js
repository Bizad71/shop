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
let scannerRunning = false;
let lastScannedCode = "";
let lastScanTime = 0;


/* =====================================================
   ابزارها
===================================================== */

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
    if (box.parentNode) {
      box.remove();
    }
  }, 3000);
}


/* =====================================================
   LOGIN
===================================================== */

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

  try {

    const { data, error } =
      await supabase.rpc(
        "get_login_email",
        {
          p_username: username
        }
      );

    if (error || !data) {

      errorBox.textContent =
        "نام کاربری یا رمز عبور اشتباه است.";

      return;
    }

    const email =
      typeof data === "string"
        ? data
        : data.get_login_email;

    const { error: loginError } =
      await supabase.auth.signInWithPassword({

        email: email,

        password: password

      });

    if (loginError) {

      console.error(loginError);

      errorBox.textContent =
        "نام کاربری یا رمز عبور اشتباه است.";

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


/* =====================================================
   USER
===================================================== */

async function loadUser() {

  const {
    data: userData,
    error
  } =
    await supabase.auth.getUser();

  if (error || !userData?.user) {

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
      .maybeSingle();

  if (profileError) {

    console.error(profileError);

    toast(
      "خطا در دسترسی به پروفایل: " +
      profileError.message,
      true
    );

    return;
  }

  if (!profileData) {

    toast(
      "پروفایل کاربر پیدا نشد.",
      true
    );

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
      .maybeSingle();

  if (shopError) {

    console.error(shopError);

    toast(
      "خطا در دسترسی به فروشگاه: " +
      shopError.message,
      true
    );

    return;
  }

  if (!shopData) {

    toast(
      "فروشگاه پیدا نشد.",
      true
    );

    return;
  }

  shop = shopData;

  showHome();
}


/* =====================================================
   LAYOUT
===================================================== */

function layout(content, activePage = "sale") {

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
          class="${activePage === "sale" ? "active" : ""}"
        >
          🛒
          <span>
            فروش
          </span>
        </button>

        <button
          data-page="receive"
          class="${activePage === "receive" ? "active" : ""}"
        >
          📦
          <span>
            ورود کالا
          </span>
        </button>

        <button
          data-page="inventory"
          class="${activePage === "inventory" ? "active" : ""}"
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


async function logout() {

  await closeScanner();

  await supabase.auth.signOut();

  profile = null;
  shop = null;

  showLogin();
}


/* =====================================================
   SALE
===================================================== */

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
          autocomplete="off"
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

      <p style="
        text-align:center;
        color:#777;
        font-size:13px;
        margin-bottom:0;
      ">
        بارکد را داخل کادر قرار بده
      </p>

    </section>

  `, "sale");

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


/* =====================================================
   RECEIVE
===================================================== */

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
          autocomplete="off"
        >

        <button
          id="searchReceive"
          class="btn-primary"
        >
          جستجو
        </button>

      </div>

      <div id="receiveResult"></div>

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

      <p style="
        text-align:center;
        color:#777;
        font-size:13px;
        margin-bottom:0;
      ">
        بارکد را داخل کادر قرار بده
      </p>

    </section>

  `, "receive");

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


/* =====================================================
   PRODUCT SEARCH
===================================================== */

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

    toast(
      "کالا پیدا نشد.",
      true
    );

    if (mode === "receive") {

      showNewProduct(code);

    }

    return;
  }

  if (mode === "sale") {

    showSaleProduct(data);

  }
  else {

    showReceiveProduct(data);

  }
}


/* =====================================================
   SALE PRODUCT
===================================================== */

function showSaleProduct(product) {

  const result =
    document.getElementById(
      "saleResult"
    );

  if (!result) {
    return;
  }

  const prices = [];

  prices.push(product.price1);

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
              data-price="${Number(price || 0)}"
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
        step="1"
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
          "قیمت را انتخاب کن.",
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
        quantity > Number(product.stock)
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


/* =====================================================
   RECEIVE PRODUCT
===================================================== */

function showReceiveProduct(product) {

  const result =
    document.getElementById(
      "receiveResult"
    );

  if (!result) {
    return;
  }

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
        step="1"
        value="1"
      >

      <label>
        قیمت اول
      </label>

      <input
        id="receivePrice1"
        type="number"
        min="0"
        value="${Number(product.price1 || 0)}"
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


/* =====================================================
   NEW PRODUCT
===================================================== */

function showNewProduct(barcode) {

  const result =
    document.getElementById(
      "receiveResult"
    );

  if (!result) {
    return;
  }

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
        step="1"
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

      const price1 =
        Number(
          document
            .getElementById(
              "newProductPrice1"
            )
            .value
        );

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

      if (
        !name ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        toast(
          "اطلاعات کالا را کامل کن.",
          true
        );

        return;
      }

      if (
        !Number.isFinite(price1) ||
        price1 < 0
      ) {

        toast(
          "قیمت اول را صحیح وارد کن.",
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


/* =====================================================
   INVENTORY
===================================================== */

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

  `, "inventory");

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

  if (!list) {
    return;
  }

  if (error) {

    console.error(error);

    list.textContent =
      "خطا در دریافت موجودی.";

    return;
  }

  if (!data || !data.length) {

    list.textContent =
      "هنوز کالایی ثبت نشده.";

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


/* =====================================================
   BARCODE SCANNER
===================================================== */

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

  section.classList.remove("hidden");

  const readerId =
    mode === "sale"
      ? "sale-reader"
      : "receive-reader";

  const reader =
    document.getElementById(readerId);

  if (!reader) {
    return;
  }

  lastScannedCode = "";
  lastScanTime = 0;

  scanner =
    new Html5Qrcode(readerId);

  try {

    /*
      تنظیمات مخصوص بارکد فروشگاهی:
      سرعت بالا + کادر افقی مناسب بارکد
    */

    const config = {

      fps: 20,

      qrbox: function(
        viewfinderWidth,
        viewfinderHeight
      ) {

        const width =
          Math.min(
            viewfinderWidth * 0.88,
            500
          );

        const height =
          Math.min(
            viewfinderHeight * 0.30,
            180
          );

        return {
          width: Math.floor(width),
          height: Math.floor(height)
        };

      },

      aspectRatio: 1.7777778,

      disableFlip: false

    };

    /*
      فرمت‌های رایج بارکد فروشگاهی
    */

    const formats = [
      0,  // QR_CODE
      1,  // AZTEC
      2,  // CODABAR
      3,  // CODE_39
      4,  // CODE_93
      5,  // CODE_128
      6,  // DATA_MATRIX
      7,  // MAXICODE
      8,  // ITF
      9,  // EAN_13
      10, // EAN_8
      11, // PDF_417
      12  // RSS_14
    ];

    /*
      اول تلاش با فرمت‌های مشخص
    */

    try {

      scannerRunning = true;

      await scanner.start(

        {
          facingMode: {
            exact: "environment"
          }
        },

        config,

        async decodedText => {

          if (!decodedText) {
            return;
          }

          const now =
            Date.now();

          /*
            جلوگیری از چند بار خواندن
            یک بارکد در یک لحظه
          */

          if (
            decodedText === lastScannedCode &&
            now - lastScanTime < 2500
          ) {

            return;

          }

          lastScannedCode =
            decodedText;

          lastScanTime =
            now;

          await handleScannedBarcode(
            mode,
            decodedText
          );

        },

        () => {}

      );

    }

    catch (cameraError) {

      console.warn(
        "Environment camera failed:",
        cameraError
      );

      /*
        اگر exact environment
        روی بعضی گوشی‌ها جواب نداد،
        دوباره بدون exact تلاش می‌کنیم.
      */

      try {

        await scanner.clear();

      }
      catch {}

      scanner =
        new Html5Qrcode(readerId);

      scannerRunning = true;

      await scanner.start(

        {
          facingMode: "environment"
        },

        config,

        async decodedText => {

          if (!decodedText) {
            return;
          }

          const now =
            Date.now();

          if (
            decodedText === lastScannedCode &&
            now - lastScanTime < 2500
          ) {

            return;
          }

          lastScannedCode =
            decodedText;

          lastScanTime =
            now;

          await handleScannedBarcode(
            mode,
            decodedText
          );

        },

        () => {}

      );

    }

  }

  catch (error) {

    console.error(
      "Scanner error:",
      error
    );

    scannerRunning = false;

    toast(
      "دوربین باز نشد. اجازه دسترسی دوربین را فعال کن.",
      true
    );

  }
}


/* =====================================================
   BARCODE RESULT
===================================================== */

async function handleScannedBarcode(
  mode,
  decodedText
) {

  /*
    تمیز کردن نتیجه بارکد
  */

  const code =
    String(decodedText)
      .trim();

  if (!code) {
    return;
  }

  /*
    نمایش سریع نتیجه
  */

  const input =
    document.getElementById(
      mode === "sale"
        ? "saleBarcode"
        : "receiveBarcode"
    );

  if (input) {
    input.value = code;
  }

  /*
    اول دوربین را متوقف می‌کنیم
  */

  await closeScanner();

  /*
    جستجوی مستقیم کالا
  */

  await searchProduct(
    mode,
    code
  );
}


/* =====================================================
   CLOSE SCANNER
===================================================== */

async function closeScanner() {

  if (!scanner) {

    scannerRunning = false;

    return;
  }

  try {

    if (scannerRunning) {

      await scanner.stop();

    }

  }

  catch (error) {

    console.warn(
      "Scanner stop:",
      error
    );

  }

  try {

    await scanner.clear();

  }

  catch {}

  scanner = null;

  scannerRunning = false;

  document
    .querySelectorAll(".reader")
    .forEach(reader => {

      reader.innerHTML = "";

    });
}


/* =====================================================
   START
===================================================== */

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

    if (data?.session) {

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


/* =====================================================
   RUN
===================================================== */

startApp();
