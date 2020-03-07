import 'babel-polyfill';
import _ from 'lodash';

import './../sass/styles.scss';
import products from './products.json';

const productsWrapper = document.querySelector('.products__list');
const basketWrapper = document.querySelector('.products__basket-wrapper');
const paginationWrapper = document.querySelector('.products__pagination-list');
const countProductPage = 15;
const countProducts = products.length;
const countPages = Math.round(countProducts / countProductPage);
const textGoods = ["товаров", "товар", "товара", "товаров"]; 

let startProductPage = 0;
let currentProductPage = 1;
let items = JSON.parse(localStorage.getItem('cart-items'));


class ProductItems {
  constructor(product) {
    this.product = product;
  }

  // Шаблон корзины
  templateBasket(product) {
    return `
      <div data-id="${product.id}" class="products__goods-item">
        <div class="products__goods-image">
          <img width="45" height="45" src="${product.image}" alt="">
        </div>
        <div class="products__goods-title">${product.title}</div>
        <div class="products__goods-amount"><span class="products__goods-amount-number">x${product.count}</span></div>
        <div class="products__goods-remove"></div>
      </div>
    `;
  }

  // Шаблон пустой корзины
  templateEmptyBasket() {
    return `
      <div class="products__total">
        <div class="products__total-title">Корзина пуста</div>
      </div>
    `;
  }

  // Шаблон блока суммы
  templateSummaBasket(summa) {
    return `
      <div class="products__total-title">Итог</div>
      <div class="products__total-price">${summa} рублей</div>
      <button class="products__total-button">Заказать</button>
    `;
  }

  // Получаем актуальное содержимое корзины
  getBasket() {
    return JSON.parse(localStorage.getItem('cart-items'));
  }

  // Получаем сумму товаров в корзине
  getSummaBasket() {
    let summa = 0;
    items = this.getBasket();
    items.forEach((product, index) => {
      summa += product.count * product.price;
    });

    return summa;
  }

  // Действия товара (кнопка)
  getProductAction(params) {
    return ` 
      <button class="products__item-button ${params.activeClass}">Добавить в корзину</button>
      ${params.amountTemp}
    `;
  }

  // Шаблон мини-карточки
  getProductsPage(product) {
    let params = this.checkProdInBasket(product.id);
    let actions = this.getProductAction(params);

    return `
      <div id="product_${product.id}" data-id="${product.id}" class="products__item">
        <div class="products__item-image">
          <img src="${product.image}" alt="">
        </div>
        <div class="products__item-body">
          <div class="products__item-title">${product.title}</div>
          <div class="products__item-price">${product.price} рублей</div>
          <div class="products__item-description">${product.descr}</div>
        </div>
        <div class="products__item-action">
          ${actions}
        </div>
      </div>
    `;
  }

  // Получаем все товары текущей страницы
  getAllProductsPage() {
    let i = 0;
    let pr = '';

    products.forEach((product, index) => {
      if (i < countProductPage &&
        index >= startProductPage &&
        index < (startProductPage + countProductPage)
      ) {
        pr += this.getProductsPage(product);
        i++;
      }
    });

    return pr;
  }

  // Формируем пагинацию
  getPaginationPage() {
    let pager = '';
    let prevItem = currentProductPage - 1;
    let nextItem = currentProductPage + 1;

    if (countPages > 3 && currentProductPage > 2) {
      pager += `<li data-page="${prevItem}" class="products__pagination-item products__pagination-prev"><</li>`;
    }

    if (currentProductPage) {
      if (currentProductPage == countPages) {
        pager += `<li data-page="${prevItem - 1}" class="products__pagination-item next">${prevItem - 1}</li>`;
      }
      if (prevItem >= 1) {
        pager += `<li data-page="${prevItem}" class="products__pagination-item prev">${prevItem}</li>`;
      }
      pager += `<li data-page="${currentProductPage}" class="products__pagination-item products__pagination-item-current">${currentProductPage}</li>`;
      if (nextItem <= countPages) {
        pager += `<li data-page="${nextItem}" class="products__pagination-item next">${nextItem}</li>`;
      }
      if (currentProductPage == 1) {
        pager += `<li data-page="${nextItem + 1}" class="products__pagination-item next">${nextItem + 1}</li>`;
      }
    }

    if (countPages > 4) {
      if (nextItem < countPages) {
        pager += `<li class="products__pagination-item products__pagination-empty">...</li>`;
        pager += `<li data-page="${countPages}" class="products__pagination-item">${countPages}</li>`;
      }
    }

    if (countPages > 3 && nextItem <= countPages) {
      pager += `<li data-page="${nextItem}" class="products__pagination-item products__pagination-next">></li>`;
    }

    return pager;
  }

  // Формируем список товаров корзины
  getProductsInBasket() {
    let bask = '';
    items = this.getBasket();
    items.forEach((product, index) => {
      bask += this.templateBasket(product);
    });

    return bask;
  }

  // Получаем все товары из корзины
  getProductsToBasket() {
    items = this.getBasket();
    if (items) {
      let bask = this.getProductsInBasket();
      let summa = this.getSummaBasket();
      let total = this.templateSummaBasket(summa);
      basketWrapper.innerHTML = `
        <div class="products__goods">${bask}</div>
        <div class="products__total">${total}</div>
      `;
    } else {
      basketWrapper.innerHTML = this.templateEmptyBasket();
    }
  }

  // Удаляем из корзины товар
  removeItemToBasket(id) {
    let findArray = false;
    let indexItem = -1;
    items = this.getBasket();
    items.forEach((item, index) => {
      if (item.id == id && !findArray) {
        indexItem = index;
        findArray = true;
      }
    });

    if (findArray) {
      if (items.length > 1) {
        items.splice(indexItem, 1);
        localStorage.setItem('cart-items',JSON.stringify(items));
      } else {
        localStorage.removeItem('cart-items');
      }
        
      items = this.getBasket();
    }

    this.updateBasket();
    this.updateProduct(id);
  }

  // Установка товара в корзину
  setItemToBasket(indexCurrent, productCurrent) {
    let arr = {};
    arr.id = products[indexCurrent].id;
    arr.title = products[indexCurrent].title;
    arr.price = products[indexCurrent].price;
    arr.image = products[indexCurrent].image;
    arr.count = 1;

    productCurrent.push(arr);
    localStorage.setItem('cart-items',JSON.stringify(productCurrent));
    items = this.getBasket();
  }
  
  // Добавляем товар в корзину
  addToCart(id) {
    let productCurrent = [];
    let indexCurrent = -1;
    products.forEach((product, index) => {
      if (product.id == id) {
        indexCurrent = index;
      }
    });

    items = this.getBasket();
    if (!items) {
      this.setItemToBasket(indexCurrent, productCurrent);
    } else {
      if (items.length) {
        let findArray = false;
        let indexItem = -1;
        items.forEach((item, index) => {
          if (item.id == id && !findArray) {
            indexItem = index;
            findArray = true;
          }
        });

        if (indexItem > -1) {
          items[indexItem].count = items[indexItem].count + 1;
          localStorage.setItem('cart-items',JSON.stringify(items));
          items = this.getBasket();
        }

        if (!findArray) {
          this.setItemToBasket(indexCurrent, items);
        }
      }
    }
  }

  // Проверка товара на наличие в корзине
  checkProdInBasket(id) {
    items = this.getBasket();
    let params = {
      activeClass: '',
      amountTemp: '',
    };

    if (items) {
      if (items.length) {
        let findArray = false;
        items.forEach((item, index) => {
          if (item.id == id && !findArray) {
            findArray = true;
            params.index = index;
            params.count = item.count;
            params.price = item.price;
            params.activeClass = 'products__item-button-active';
            params.amountTemp =  `
              <div class="products__item-cart">Добавлено: 
                <span class="products__item-cart-count">${item.count} товаров</span>
              </div>
            `;
          }
        });
      }
    }

    return params;
  }

  // Поиск продукта по ID
  searchProductByID(id) {
    let findProduct = false;
    products.forEach((product, index) => {
      if (product.id == id) {
        findProduct = product;
      }
    });

    return findProduct;
  }

  // Вешаем обработчик удаления из корзины
  actionBasketPage(product) {
    if (document.querySelectorAll('.products__goods-remove')) {
      let buttons = document.querySelectorAll('.products__goods-remove');

      if (product) {
        buttons = product.querySelectorAll('.products__goods-remove');
      }

      Object.values(buttons).map((button) => {
        button.addEventListener('click', (e) => {
          let item = e.target.closest('.products__goods-item');
          let id = Number(item.dataset.id);
          this.removeItemToBasket(id);
        });
      });
    }
  }

  // Вешаем обработчик клика на кнопки "В корзину"
  actionProductPage(product) {
    if (document.querySelectorAll('.products__item-button')) {
      let buttons = document.querySelectorAll('.products__item-button');

      if (product) {
        buttons = product.querySelectorAll('.products__item-button');
      }

      Object.values(buttons).map((button) => {
        button.addEventListener('click', (e) => {
          let item = e.target.closest('.products__item');
          let id = Number(item.dataset.id);
          this.addToCart(id);
          this.updateProduct(id);
          this.updateBasket();
        });
      });
    }
  }

  // Вешаем обработчик клика на кнопки пагинатора
  actionPaginationPage() {
    if (document.querySelectorAll('.products__pagination-item')) {
      const pagers = document.querySelectorAll('.products__pagination-item');
      Object.values(pagers).map((item) => {
        if (!item.classList.contains('products__pagination-empty')) {
          item.addEventListener('click', (e) => {
            let page = Number(e.target.dataset.page);
            currentProductPage = page;
            this.updateProducts();
          });
        }
      });
    }
  }

  // Обновление действий товара
  updateProductItem(product, params) {
    let prod = document.getElementById(`product_${product.id}`);
    let actions = this.getProductAction(params);
    if (prod) {
      prod.querySelector('.products__item-action').innerHTML = actions;
    }
    this.actionProductPage(prod);
  }

  // Обновляем продукт
  updateProduct(id) {
    let product = this.searchProductByID(id);
    let params = this.checkProdInBasket(id);
    this.updateProductItem(product, params);
  }

  // Обновляем корзину
  updateBasket() {
    this.getProductsToBasket();
    this.actionBasketPage();
  }

  // Обновляем блок с товарами и пагинацией
  updateProducts() {
    // Получаем начальное значение
    startProductPage = ((currentProductPage * countProductPage) - countProductPage);

    // Чистим содержимое блоков
    basketWrapper.innerHTML = "";
    productsWrapper.innerHTML = "";
    paginationWrapper.innerHTML = "";

    if (basketWrapper) {
      this.getProductsToBasket();
      this.actionBasketPage();
    }

    if (productsWrapper) {
      productsWrapper.innerHTML = this.getAllProductsPage();
      this.actionProductPage();
    }

    if (paginationWrapper) {
      paginationWrapper.innerHTML = this.getPaginationPage();
      this.actionPaginationPage();
    }
  }
}

/*
*  Если есть товары
*/
if (products.length) {
  const dict = new ProductItems();
  dict.updateProducts();
}