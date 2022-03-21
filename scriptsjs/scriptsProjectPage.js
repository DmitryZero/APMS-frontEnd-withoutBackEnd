let dateWithTime = new Intl.DateTimeFormat("ru", {
  timeStyle: "medium",
  dateStyle: "short",
  formatMatcher: "best fit"
});

var dictOfStatusCard = {
  "IN_PROCESS": "В процессе",
  "FROZEN": "Приостановлен",
  "DONE": "Завершён",
  "В процессе": "IN_PROCESS",
  "Приостановлен": "FROZEN",
  "Завершён": "DONE",    
  "BUSINESS_ADMINISTRATOR": "Администратор",
  "CURATOR": "Консультант",
  "USER": "Пользователь"
}

var dictOfGradingCards = {
  "IN_PROCESS": "В процессе выполнения",
  "CHECK_REQUIRED": "Нуждается в проверке",    
  "DONE": "Принято",
  "ACCEPTED":"Зачтено",
  "DENIED": "Отклонено"
}

function SaveStatusFunction() {
  let radios = document.getElementsByName('flexRadioStatus');


  for (var i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      document.getElementById('inputStatus').value = radios[i].value;
      // EditProject(localStorage.getItem('tokenOfProject'), document.querySelector('#nameOfProject').value, dictOfStatusCard[radios[i].value]);
      break;
    }
  }
}

function setAttributes(el, attrs) {
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

//  логика класов HTML
function hasClass(ele, cls) {
  return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function addClass(id, cls) {
  ele = document.getElementById(id);
  if (!hasClass(ele, cls)) ele.className += " " + cls;
}

function removeClass(id, cls) {
  ele = document.getElementById(id);
  if (hasClass(ele, cls)) {
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ');
  }
}

document.querySelector('#nameOfProject').addEventListener('change', (e) => {
  console.log('Было изменено название проекта');
  // EditProject(localStorage.getItem('tokenOfProject'), document.querySelector('#nameOfProject').value, 'IN_PROCESS');
});

let addColumnBtn = document.getElementById("createColumn");
var userRole = "";

async function LoadStageAndCardsFromDB(tokenOfStage) {
  var stageParams = await GetStage(tokenOfStage);
  var stageEntity = new StageForCards(stageParams['name'], stageParams['id']);
  for (var i = 0; i < Object.keys(stageParams['cardUuidList']).length; i++) {
    var cardParams = await GetCard(stageParams['cardUuidList'][i]);
    await stageEntity.pushCardToStage(stageParams['cardUuidList'][i], cardParams);
    var k = 2;
  }
  stageEntity.render();
}

addColumnBtn.addEventListener('click', async () => {
  console.log("Была нажата addColumnBtn");
  var nameOfStage = document.querySelector('#nameColum').value;
  if (nameOfStage == '') nameOfStage = 'Новый этап';
  // let uuidOfStage = await AddStage(nameOfStage); 
  var stageEntity = new StageForCards(nameOfStage, "someId");
  document.querySelector('#nameColum').value = "";
  stageEntity.render();
});

//Логика этапов. Определяем место, куда будем помещать этапы
let root = document.getElementById("addColumn");

class StageForCards {
  constructor(title, tokenOfStage) {
    if (title.value == "") title.value = "Новый этап";

    this.stageEntity = {
      title: title,
      uuidOfStage: tokenOfStage,
      cardList: []
    }
  }

  pushCardToStage(tokenOfCard, cardParams) {
    var card = new Card();
    card.init(tokenOfCard, cardParams);
    this.stageEntity.cardList.push(card);
  }

  render() {
    this.createStageForCards();
    for (var i = 0; i < this.stageEntity.cardList.length; i++) {
      this.stageEntity.cardList[i].render(this);
    }
  }
  createStageForCards() {
    // Контейнер-этапа
    this.divStage = document.createElement('div');
    this.divStage.classList.add('col-my', 'col-3');
    this.divStage.dataset.uuidOfStage = this.stageEntity.uuidOfStage;

    //Заголовок этапа
    this.divHeader = document.createElement('div');
    this.divHeader.classList.add('col-header', 'row');

    //Кнопка для добавления карточки
    this.AddCardBtn = document.createElement('button');
    setAttributes(this.AddCardBtn, { "type": "button", "aria-label": "Добавить новую карточку", "aria-expanded": "false" });
    this.AddCardBtn.classList.add('button-new-card');
    if (userRole == "CURATOR") this.AddCardBtn.setAttribute('style', 'display:none');
    this.AddCardBtn.addEventListener('click', async (e) => {
      console.log("Была нажата addCardBtn");
      this.AddCardBtn.setAttribute("style", "display:none");

      var card = new Card();
      card.createCardInputFormElement(this);
    })
    this.AddCardBtn.innerHTML = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-plus">' +
      '<path fill-rule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path>' +
      '</svg>';

    //Счётчик количества карточек в этапе
    this.numberOfCards = document.createElement('div');
    this.numberOfCards.classList.add('col');
    this.numberOfCards.insertAdjacentHTML('beforeend', '<span class="number-cards">0</span>');
    this.numberOfCards.setAttribute('style', "text-align: start");

    //Кнопка удалить этап
    this.DeleteColumnBtn = document.createElement('button');
    setAttributes(this.DeleteColumnBtn, { "type": "button" });
    this.DeleteColumnBtn.innerText = "Удалить этап";
    if (userRole == "CURATOR") this.DeleteColumnBtn.setAttribute('style', 'display:none');
    this.DeleteColumnBtn.addEventListener('click', async () => {
      // await DeleteStage(this.stageEntity.uuidOfStage, localStorage.getItem('tokenOfProject'));
      console.log("Была нажата DeleteColumnBtn");
      this.divStage.remove();
    })   

    //"Собираем" заголовок карточки
    this.divHeader.append(this.numberOfCards);

    this.detailsCloseStage = document.createElement('details');
    this.detailsCloseStage.classList.add('column-menu');
    this.detailsCloseStage.insertAdjacentHTML('beforeend', 
      '<summary class="column-menu" aria-label="Column menu" aria-haspopup="menu" role="button">' +
      '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-kebab-horizontal">' +
      '<path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>' +
      '</svg>' +
      '</summary>' +
      '<div class="open"></div>');
    this.detailsCloseStage.querySelector('.open').appendChild(this.DeleteColumnBtn); //Помещаем кнопку в <div class="open"></div>
          
    this.btnContainer = document.createElement('div');
    this.btnContainer.setAttribute('style', 'text-align: end');
    this.btnContainer.classList.add('col');
    this.btnContainer.append(this.AddCardBtn, this.detailsCloseStage);

    this.divHeader.append(this.btnContainer);

    this.divTitle = document.createElement('div');
    this.divTitle.insertAdjacentHTML('beforeend', '<h3 style="height:fit-content" class="name-column">' +
      '<input class="inputProject form-control" value="' + this.stageEntity.title + '"></h3>');

    this.divTitle.querySelector('.inputProject').addEventListener('change', async (e) => {      
      // await EditStage(this.stageEntity.uuidOfStage, this.divTitle.querySelector('.inputProject').value);
    });

    //Контейнер в этапе, который содержит текст карточки
    this.divStageContent = document.createElement('div');
    this.divStageContent.classList.add('col-content');

    //Дособираем итоговый этап
    this.divStage.append(this.divHeader);
    this.divStage.append(this.divTitle);
    this.divStage.append(this.divStageContent);

    root.before(this.divStage);

    details = [...document.querySelectorAll('details')];
  }
}

//Класс, описывающий карточку
var lastOpenCard;
class Card {
  constructor() {
    this.cardEntity = {
      id: "",
      title: "",
      status: "",
      description: "",
      commentList: [],
      lastChangeDate: null,
      lastModifiedUserId: null,
      mark: ""
    }
  }

  async init(tokenOfCard, cardParams) {
    this.cardEntity = {
      id: tokenOfCard,
      title: cardParams["name"],
      status: cardParams["status"],
      description: cardParams["content"],
      commentList: [],
      lastChangeDate: cardParams["lastModifiedDate"],
      lastModifiedUserId: cardParams['lastModifiedUserId'],
      mark: cardParams["mark"]
    }
    await this.LoadComments();
  }

  render(stageInstance) {
    this.createCardElement(stageInstance);
  }

  createCardElement(stageInstance) {
    //Контейнер для карточки
    this.card = document.createElement('div');
    this.card.classList.add('card');
    this.card.addEventListener('click', (e) => {
      if (!e.detail || e.detail == 1) {
        console.log("Была открыта карточка");
        lastOpenCard = this.card;
        this.showCard(stageInstance); //Открываем карточку
      }
    })

    //Название карточки
    this.cardName = document.createElement('div');
    this.cardName.innerText = this.cardEntity.title; // + "|" + this.cardEntity.id;

    //Кнопка удалить карточку
    this.DeleteCardBtn = document.createElement('button');
    this.DeleteCardBtn.classList.add('button');
    this.DeleteCardBtn.innerText = "x";
    if (userRole == "CURATOR") this.DeleteCardBtn.setAttribute('style', 'display:none');
    this.DeleteCardBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); //Убираем открытие карточки, при нажатии на кнопку внутри карточки
      stageInstance.numberOfCards.querySelector('.number-cards').innerText = Number(stageInstance.numberOfCards.innerText) - 1;
      this.card.remove();
      // DeleteCard(this.cardEntity.id);
      let i = stageInstance.stageEntity.cardList.indexOf(this);
      stageInstance.stageEntity.cardList.splice(i, 1);
      console.log("Была удалена карточка");
    });

    //Собираем объекты
    this.card.insertAdjacentHTML('beforeend',
      '<span class="card-svg">' +
      '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-note">' +
      '<path fill-rule="evenodd" d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0114.25 14H1.75A1.75 1.75 0 010 12.25v-8.5zm1.75-.25a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25H1.75zM3.5 6.25a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z"></path>' +
      '</svg>' +
      '</span>' +
      '<span class="card-content">' + this.cardName.innerText + '</span>' +
      '<small class="add-info color-fg-muted">Статус: <a id="smallStatus" class="color-text-primary" href="#" draggable="false">'
        + dictOfGradingCards[this.cardEntity.status] + '</a></small>');
    this.btnWrapper = document.createElement('div');
    this.btnWrapper.classList.add('button-wrapper');
    this.btnWrapper.append(this.DeleteCardBtn);
    this.card.append(this.btnWrapper);

    stageInstance.divStageContent.append(this.card); //Вместно неё добавляем обычную карточку
  }

  createCardInputFormElement(stageInstance) {
    //Создаём контейнер для формы заполнения карточки
    this.formCard = document.createElement('div');
    setAttributes(this.formCard, { "class": "form", "accept-charset": "UTF-8" });

    this.inputContentType = document.createElement('input');
    setAttributes(this.inputContentType, { "type": "hidden", "name": "content_type", "value": "Note" });

    this.inputClientUid = document.createElement('input');
    setAttributes(this.inputClientUid, { "type": "hidden", "name": "client_uid" });

    //Поле ввода текста для формы
    this.textAreaOfCardForm = document.createElement('textarea');
    setAttributes(this.textAreaOfCardForm, {
      "name": "note", "required": "", "autofocus": "", "aria-label": "Название задачи", "class": "form-control input-block js-quick-submit js-size-to-fit js-note-text js-length-limited-input",
      "data-input-max-length": "256", "data-warning-length": "99", "data-warning-text": "{{remaining}} remaining", "placeholder": "Название задачи", "spellcheck": "false"
    });
    this.textAreaOfCardForm.setAttribute('style', "resize:none");

    //Контейнер для кнопок
    this.divContainerForBtn = document.createElement('div');
    this.divContainerForBtn.classList.add('flex');

    //Потвердить создание карточки
    this.submitCardBtn = document.createElement('button');
    setAttributes(this.submitCardBtn, { "type": "submit", "class": "btn" });
    this.submitCardBtn.innerText = "Добавить";
    this.submitCardBtn.addEventListener('click', async (e) => {
      if (!e.detail || e.detail == 1) {
        console.log("Была нажата кнопка потверждения создания карточки");
        stageInstance.numberOfCards.querySelector('.number-cards').innerText = Number(stageInstance.numberOfCards.innerText) + 1;

        var nameOfCard = ""
        if (this.textAreaOfCardForm.value == "") nameOfCard = "Новая карточка";
        else nameOfCard = this.textAreaOfCardForm.value;
        // var tokenOfCard = await AddCard(stageInstance.stageEntity.uuidOfStage, nameOfCard, '');
        var tokenOfCard = "someToken";
        var cardParams = {
          id: tokenOfCard,
          name: nameOfCard,
          status: "IN_PROCESS",
          content: "",
          commentUuidList: [],
          lastModifiedDate: new Date(),
          lastModifiedUserId: localStorage.getItem('token'),
          mark: ""
        };
        this.init(tokenOfCard, cardParams);
        this.createCardElement(stageInstance);
        this.formCard.remove();
        stageInstance.AddCardBtn.setAttribute("style", "display:inline"); //Возвращаем кнопку
      }
    })

    //Отменить создание карточки
    this.deleteCardForm = document.createElement('button');
    setAttributes(this.deleteCardForm, { "type": "button", "class": "btn" });
    this.deleteCardForm.innerText = "Отмена";
    this.deleteCardForm.addEventListener('click', () => {
      console.log("Была нажата кнопка отмены создания карточки");
      this.formCard.remove(); //Убираем форму
      stageInstance.AddCardBtn.setAttribute("style", "display:inline"); //Возвращаем кнопку
    })

    //Теперь собираем все компоненты воедино
    this.divContainerForBtn.append(this.submitCardBtn, this.deleteCardForm);
    this.formCard.append(this.inputContentType, this.inputClientUid, this.textAreaOfCardForm, this.divContainerForBtn);

    stageInstance.divStageContent.insertBefore(this.formCard, stageInstance.divStageContent.firstChild);
  }

  //Окно, вызываемое при отркытии карточки
  async showCard(stageInstance) {
    //Затемнённая область позади карточки
    this.divCardContainer = document.createElement('div');
    this.divCardContainer.classList.add('card-wrapper');
    //Будем закрывать карточку, если нажимаем на затемнённую область
    this.divCardContainer.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains("card-wrapper")) {
        this.divCardContainer.remove();
      }
    })

    //Контейнер, содержащий все элементы карточки
    this.divCard = document.createElement('div');
    setAttributes(this.divCard, { "class": "form-card" });

    //Кнопка, чтобы закрыть карточку
    this.closeCardBtn = document.createElement('div');
    this.closeCardBtn.classList.add('close');
    this.closeCardBtn.innerHTML = '<button type="button" name="close" class="button">x</button>';
    this.closeCardBtn.addEventListener('click', () => {
      this.divCardContainer.remove();
    });

    //Заголовок карточки
    //================================================================================================//
    this.divHeader = document.createElement('div');
    this.divHeader.classList.add('header');
    this.divHeader.insertAdjacentHTML('beforeend',
      '<div class="info">' +
      '<h3 id = "nameCard"><input id="inputNameOfCard" onclick="select()" class="name" value="' + this.cardEntity.title + '"></h3>' +  //+ this.cardEntity.id
      '<p id = "statusOfCard">' + dictOfGradingCards[this.cardEntity.status] + '</p>' +
      '</div>');
    this.divHeader.querySelector('#inputNameOfCard').addEventListener('change', async (e) => {
      this.cardEntity.title = this.divHeader.querySelector('#inputNameOfCard').value;
      if (lastOpenCard) lastOpenCard.querySelector('.card-content').innerText = this.cardEntity.title;
      await EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
    });    

    this.divHeader.append(this.closeCardBtn);

    // var user = await GetUser(this.cardEntity.lastModifiedUserId);
    // this.divHeader.insertAdjacentHTML('beforeend',
    //   '<div class="last-change">' +
    //   '<p id = "lastData">Последнее изменение: ' + dateWithTime.format(Date.parse(this.cardEntity.lastChangeDate)) + '</p>' +
    //   '<p id = "lastUser">Изменил(а): ' + user['lastName'] + ' ' + user['firstName'] + ' ' + user['patronymic'] + '</p>' +
    //   '</div>');
    //================================================================================================//


    //Содержимое карточки
    //================================================================================================//
    this.divContent = document.createElement('div');
    this.divContent.classList.add('content');
    //Контейнер для кнопок Содержание и Изменить
    this.btnContainer = document.createElement('div');
    this.btnContainer.classList.add('mode');
    //Кнопка "Содержание"
    this.ContentBtn = document.createElement('button');
    setAttributes(this.ContentBtn, { "id": "viewingCardContents", "type": "button", "name": "viewing", "disabled": "true" });
    this.ContentBtn.innerText = "Содержание";   
    this.ContentBtn.addEventListener('click', () => {
      console.log("Содержание");
      this.ContentBtn.parentNode.childNodes[0].setAttribute("disabled", "true");
      this.ContentBtn.parentNode.childNodes[1].removeAttribute('disabled');
      this.ContentBtn.parentNode.parentNode.childNodes[1].childNodes[0].setAttribute("disabled", "true");
    });
    //Кнопка "Изменить"
    this.ChangeContentBtn = document.createElement('button');
    setAttributes(this.ChangeContentBtn, { "id": "changeCardContents", "type": "button", "name": "change" });
    this.ChangeContentBtn.innerText = "Изменить";
    if (userRole == "CURATOR") this.ChangeContentBtn.disabled = true;
    this.ChangeContentBtn.addEventListener('click', () => {
      console.log("Изменить");
      this.ChangeContentBtn.parentNode.childNodes[0].removeAttribute('disabled');
      this.ChangeContentBtn.parentNode.childNodes[1].setAttribute("disabled", "true");
      this.ChangeContentBtn.parentNode.nextSibling.childNodes[0].removeAttribute('disabled');
    });
    //Контейнер для текстового поля
    this.divTextContainer = document.createElement('div');
    setAttributes(this.divTextContainer, { "class": "filling", "placeholder": "Введите содержание карточки" });
    this.divTextContainer.classList.add('filling');
    //Текстовое поле
    this.textAreaForCard = document.createElement('textarea');
    this.textAreaForCard.setAttribute('disabled', 'true');
    this.textAreaForCard.value = this.cardEntity.description;
    this.textAreaForCard.addEventListener('change', async (e) => {
      this.cardEntity.description = this.textAreaForCard.value;
      this.ContentBtn.click();
      // await EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
      this.cardEntity.status = "IN_PROCESS";
      this.cardEntity.mark = null;
      lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
      this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards[this.cardEntity.status];
      this.acceptTaskBtn.disabled = false;
      this.denyTaskBtn.disabled = false;
      this.markDiv.innerText = "Оценка задачи: " + 'задание не проверено';
    });
    //Собираем эту часть карточки
    this.btnContainer.append(this.ContentBtn, this.ChangeContentBtn);
    this.divTextContainer.append(this.textAreaForCard);
    this.divContent.append(this.btnContainer, this.divTextContainer);
    //================================================================================================//


    //Боковые кнопки
    //================================================================================================//
    //Контейнер для кнопок
    this.actionsBtns = document.createElement('div');
    this.actionsBtns.classList.add('actions');
    this.actionsBtns.insertAdjacentHTML('beforeend', '<h4>Действия</h4>');
    //Кнопки
    this.acceptTaskBtn = document.createElement('button');
    setAttributes(this.acceptTaskBtn, { "type": "button", "name": "estimate" });
    if (userRole != "Manager") this.acceptTaskBtn.setAttribute('style', "display:none");
    this.acceptTaskBtn.innerText = "Зачесть задание";
    this.acceptTaskBtn.addEventListener('click',  () => {      
      if (!this.cardEntity.mark || this.cardEntity.mark == "DENIED"){
        this.markDiv.innerText = "Оценка задачи: зачтено";
        this.acceptTaskBtn.disabled = true;
        this.denyTaskBtn.disabled = false;
        this.cardEntity.mark = "ACCEPTED"; 
        this.cardEntity.status = "DONE";
        lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
        this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards[this.cardEntity.status];
        EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
      }
    });    

    this.denyTaskBtn = document.createElement('button');
    setAttributes(this.denyTaskBtn, { "type": "button", "name": "estimate" });
    if (userRole != "Manager") this.denyTaskBtn.setAttribute('style', "display:none");
    this.denyTaskBtn.innerHTML = "Отклонить задание";
    this.denyTaskBtn.addEventListener('click',  () => {      
      if (!this.cardEntity.mark || this.cardEntity.mark == "ACCEPTED"){
        this.markDiv.innerText = "Оценка задачи: отклонено";
        this.acceptTaskBtn.disabled = false;
        this.denyTaskBtn.disabled = true;
        this.cardEntity.mark = "DENIED"; 
        this.cardEntity.status = "IN_PROCESS";
        lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
        this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards[this.cardEntity.status];
        EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
      }
    });  

    switch (this.cardEntity.mark) {
      case "ACCEPTED":
        this.acceptTaskBtn.disabled = true;
        this.denyTaskBtn.disabled = false;
        break;
      case "DENIED":
        this.acceptTaskBtn.disabled = false;
        this.denyTaskBtn.disabled = true;
        break;
    }

    //Кнопка "Изменить статус"
    this.status = document.createElement('button');
    setAttributes(this.status, { "type": "button", "name": "status" });
    this.status.innerText = "Изменить статус";
    if (userRole == "Manager" || userRole == "CURATOR") this.status.setAttribute('style', 'display:none')
    this.status.addEventListener('click', () => {
      this.statusWindowWrapper = document.createElement('div');
      setAttributes(this.statusWindowWrapper, { "class": "pop-outer", "id": "statusWindow" })
      this.statusWindowWrapper.insertAdjacentHTML('beforeend',
        '<div id = "form-status" class="form-status">' +
        '<div class="header">' +
        '<h3>Изменить статус</h3>' +
        '<button type="button" name="close" class="button">x</button>' +
        '</div>' +
        '<div class="status" style="width:fit-content">' +
        '<div>' +
        '<input id="inProcess" type="radio" name="status" value="В процессе выполнения"> В процессе выполнения' +
        '</div>' +
        '<div>' +
        '<input id="Checking" type="radio" name="status" value="Нуждается в проверке"> Нуждается в проверке' +
        '</div>' +
        '<div>' +
        '<input id="Completed" style="display:none" type="radio" name="status" value="Принято">' +
        '</div>' +
        '</div>' +
        '</div>');

      this.statusWindowWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.id == "statusWindow") {
          this.statusWindowWrapper.remove();
        }
      })
      this.statusWindowWrapper.querySelector('.button').addEventListener('click', () => {
        this.statusWindowWrapper.remove();
      })
      this.statusWindowWrapper.querySelector('#inProcess').addEventListener('click', () => {
        this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards['IN_PROCESS'];
        this.cardEntity.status = 'IN_PROCESS';
        // EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
        lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
      });
      this.statusWindowWrapper.querySelector('#Checking').addEventListener('click', () => {
        this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards['CHECK_REQUIRED'];
        this.cardEntity.status = 'CHECK_REQUIRED';
        // EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
        lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
      });
      // this.statusWindowWrapper.querySelector('#Completed').addEventListener('click', () => {
      //   this.divCard.querySelector('#statusOfCard').innerText = dictOfGradingCards['DONE'];
      //   this.cardEntity.status = 'DONE';
      //   EditCard(this.cardEntity.id, this.cardEntity.title, this.cardEntity.status, this.cardEntity.description, this.cardEntity.mark);
      //   lastOpenCard.querySelector('#smallStatus').innerText = dictOfGradingCards[this.cardEntity.status];
      // });      
      document.getElementById('showCardContaier').append(this.statusWindowWrapper);
    });

    this.delete = document.createElement('button');
    setAttributes(this.delete, { "type": "button", "name": "delete" });
    this.delete.innerText = "Удалить";
    if (userRole == "CURATOR") this.delete.setAttribute('style', 'display:none');
    this.delete.addEventListener('click', async (e) => {
      stageInstance.numberOfCards.querySelector('.number-cards').innerText = Number(stageInstance.numberOfCards.innerText) - 1;
      // DeleteCard(this.cardEntity.id);
      this.card.remove();
      this.divCardContainer.remove();
      let i = stageInstance.stageEntity.cardList.indexOf(this);
      stageInstance.stageEntity.cardList.splice(i, 1);
    });

    //Оценка
    this.markDiv = document.createElement('div');
    this.markDiv.classList.add('mark-div');    
    if (!this.cardEntity.mark) this.markDiv.innerText = "Оценка задачи: " + 'задание не проверено';
    else if (this.cardEntity.mark == "ACCEPTED" || this.cardEntity.mark == "DENIED") this.markDiv.innerText = "Оценка задачи: " + dictOfGradingCards[this.cardEntity.mark];

    //Собираем эту часть карточки
    this.actionsBtns.append(this.acceptTaskBtn, this.denyTaskBtn, this.status, this.delete, this.markDiv);
    //================================================================================================//

    //Коментарии
    //================================================================================================//    
    this.divComments = document.createElement('div');
    this.divComments.classList.add('comments');
    this.divComments.setAttribute('style', "width:95%");
    this.divComments.insertAdjacentHTML('beforeend', '<h5>Коментарии</h5>');
    //Контейнер для ввода комментария
    this.inputCommentContainer = document.createElement('div');
    this.inputCommentContainer.classList.add('new');
    //textarea для ввода коментария
    this.textAreaComment = document.createElement('textarea');
    setAttributes(this.textAreaComment, { "placeholder": "Новый комменатрий", "name": "comment", "rows": "3", "required": "true" });
    //Контейнер для старых комментариев
    this.oldCommentsContainer = document.createElement('div');
    setAttributes(this.oldCommentsContainer, { "class": "old", "id": "commentList" });
    await this.renderComments(this.oldCommentsContainer);
    //Кнопка "Сохранить комменатрий"
    this.saveCommentBtn = document.createElement('button');
    this.saveCommentBtn.setAttribute('style', "flex:right");
    setAttributes(this.saveCommentBtn, { "type": "button", "name": "sendComment", "class": "btn" });
    this.saveCommentBtn.innerText = "Сохранить";
    this.saveCommentBtn.addEventListener('click', async () => {
      if (this.textAreaComment.value != "") {
        // var tokenOfComment = await CreateComment(localStorage.getItem('tokenOfProject'), this.cardEntity.id, this.textAreaComment.value);
        var tokenOfComment = "someToken";
        this.cardEntity.commentList.push(new Comment(this.textAreaComment.value, "someToken", tokenOfComment,
          dateWithTime.format(new Date())));
        this.cardEntity.commentList[this.cardEntity.commentList.length - 1].render(this);
        this.textAreaComment.value = "";
      }
    });
    //Собираем данный элемент карточки
    this.inputCommentContainer.append(this.textAreaComment, this.saveCommentBtn, this.oldCommentsContainer);
    this.divComments.append(this.inputCommentContainer);
    //================================================================================================//

    //Собираем карточку
    this.divCard.append(this.divHeader, this.divContent, this.actionsBtns, this.divComments);
    this.divCardContainer.append(this.divCard);
    document.getElementById('showCardContaier').append(this.divCardContainer);

    var input = $("input[id=inputNameOfCard]");
    input.focusin(function () {
        $(this).addClass("inputProject form-control");
      });
      input.focusout(function () {
        $(this).removeClass("inputProject form-control");
      });    
  }

  async LoadComments() {
    // var listOfComments = await GetAllComments(localStorage.getItem('tokenOfProject'), this.cardEntity.id);

    // for (var i = 0; i < Object.keys(listOfComments).length; i++) {
    //   this.cardEntity.commentList.push(new Comment(listOfComments[i]['content'], listOfComments[i]['userOwnerUuid'], listOfComments[i]['commentId'],
    //     dateWithTime.format(Date.parse(listOfComments[i]['dateCreated']))));
    // }
  }

  async renderComments() {
    for (var i = 0; i < this.cardEntity.commentList.length; i++) {
      this.cardEntity.commentList[i].render(this);
    }
  }
}

class Comment {
  constructor(textOfComment, userOwnerUuid, commentId, date) {
    this.comment = textOfComment;
    this.date = date;
    this.userOwnerUuid = userOwnerUuid;
    this.commentId = commentId;
  }

  async render(cardInstance) {
    // var user = await GetUser(this.userOwnerUuid);
    var user = {
      firstName: "Дмитрий",
      lastName: "Никитин",
      patronymic: "Алексеевич"
    }

    //Кнопка удалить комментарий
    this.deleteCommentBtn = document.createElement('button');
    setAttributes(this.deleteCommentBtn, { "type": "button", "name": "sendComment", "class": "close", "style": "float:right" });
    this.deleteCommentBtn.innerText = "X";
    if (localStorage.getItem('token') != this.userOwnerUuid) this.deleteCommentBtn.setAttribute('style', 'display:none');
    this.deleteCommentBtn.addEventListener('click', async () => {
      DeleteComment(localStorage.getItem('tokenOfProject'), cardInstance.cardEntity.id, this.commentId);
      this.divContainerOfComment.remove();
      let i = cardInstance.cardEntity.commentList.indexOf(this);
      cardInstance.cardEntity.commentList.splice(i, 1);
    })

    this.divContainerOfComment = document.createElement('div');
    this.divContainerOfComment.className = "elem-comment";
    this.divContainerOfComment.append(this.deleteCommentBtn);
    this.divContainerOfComment.insertAdjacentHTML('beforeend',
      '<div class="info-comment">' +
      '<a id = "userCommen">' + user['lastName'] + ' ' + user['firstName'] + ' ' + user['patronymic'] + '</a>' +
      '<data id = "dataComment">' + this.date + '</data>' +
      '</div>' +
      '<div class="content-comment">' +
      '<p id = "contentComment" style="word-break:break-word">' + this.comment + '</p>' +
      '</div>')
    cardInstance.oldCommentsContainer.appendChild(this.divContainerOfComment);
  }
}

var statusOfUser = "";
class Participant {
  constructor(userParams, id) {
    this.ParticipantEntity = {
      firstName: userParams["firstName"],
      lastName: userParams['lastName'],
      patronymic: userParams['patronymic'],
      role: userParams['role'],
      id: id
    }
  }

  render(place, isItHasDeleteBtn) {
    var role = this.ParticipantEntity.role;
    if (this.ParticipantEntity.role == "Участник") role = role.substring(0, 4);
    else role = role.substring(0, 3);

    var divUserElement = document.createElement('div');
    divUserElement.classList.add("row", "align-items-center", "gy-5", "border-bottom");
    divUserElement.dataset.role = this.ParticipantEntity.role;
    divUserElement.insertAdjacentHTML('beforeend',
      '<div class="col-1">' +
      '<span">' + role + '.' + '</span>' +
      '</div>' +
      '<div class="col text-center">' +
      '<a target="_blank" rel="noopener noreferrer" style="float:right">' +
      this.ParticipantEntity.lastName + ' ' + this.ParticipantEntity.firstName + ' ' + this.ParticipantEntity.patronymic +
      '</a>' +
      '</div>' +
      '<div class="col-1"><button id="deleteParticipant" class="btn btn-sm transparent pull-right" style="display:none" title="Исключить участника">' +
      '<i class="bi bi-x-lg"></i>' +
      '</button>' +
      '</div>');
    if (isItHasDeleteBtn) divUserElement.querySelector('#deleteParticipant').removeAttribute('style');
    place.appendChild(divUserElement);

    divUserElement.querySelector('#deleteParticipant').addEventListener('click', () => {
      if (statusOfUser == "Manager") DeleteConsultant(this.ParticipantEntity.id);
      else if (statusOfUser == "Captain") DeleteMember(this.ParticipantEntity.id);
      divUserElement.remove();
    })
  }
}

async function LoadMembersOfProject(project = "") {
  var place = document.querySelector('#MembersList');
  if (project == "") project = await GetProject(localStorage.getItem('tokenOfProject'));

  if (localStorage.getItem('token') == project['userCaptain']) statusOfUser = "Captain";
  if (localStorage.getItem('token') == project['projectManager']) statusOfUser = "Manager";

  var captainParams = await GetUser(project['userCaptain']);
  captainParams['role'] = "Капитан";

  var managerParams = await GetUser(project['projectManager']);
  managerParams['role'] = "Менеджер";

  var manager = await new Participant(managerParams, project['projectManager']);
  var captain = await new Participant(captainParams, project['userCaptain']);

  captain.render(document.querySelector('#captain_list'), false);
  manager.render(document.querySelector('#manager_list'), false);

  for (var i = 0; i < project['usersConsultantsUuidList'].length; i++) {
    var consultantParams = await GetUser(project['usersConsultantsUuidList'][i]);
    consultantParams['role'] = 'Консультант';
    var consultant = new Participant(consultantParams, project['usersConsultantsUuidList'][i]);
    if (statusOfUser == "Manager") consultant.render(document.querySelector('#curator_list'), true);
    else consultant.render(document.querySelector('#curator_list'), false);
  }

  for (var i = 0; i < project['usersMembersUuidList'].length; i++) {
    var memberParams = await GetUser(project['usersMembersUuidList'][i]);
    memberParams['role'] = 'Участник';
    var member = new Participant(memberParams, project['usersMembersUuidList'][i]);
    if (statusOfUser == "Captain") member.render(document.querySelector('#member_list'), true);
    else member.render(document.querySelector('#member_list'), false);
  }
}

function AddNewParticipant(participantParams) {
  var participant = new Participant(participantParams, participantParams["id"]);
  if (participant.ParticipantEntity.role == 'USER') {
    participant.ParticipantEntity.role = 'Участник';
    if (statusOfUser == "Captain") participant.render(document.querySelector('#member_list'), true);
    else participant.render(document.querySelector('#member_list'), false);
  }
  else if (participant.ParticipantEntity.role == 'CURATOR') {
    participant.ParticipantEntity.role = 'Консультант';
    if (statusOfUser == "Manager") participant.render(document.querySelector('#curator_list'), true);
    else participant.render(document.querySelector('#curator_list'), false);
  }
}


document.querySelector('#sendInvite').addEventListener('click', (e) => {
  AddUsersToMembersOfProject();
  $('#AddMembers').modal('hide');
})

var details;

// document.addEventListener('click', function (e) {
//   if (!details.some(f => f.contains(e.target))) {
//     details.forEach(f => f.removeAttribute('open'));
//   } else {
//     details.forEach(f => !f.contains(e.target) ? f.removeAttribute('open') : '');
//   }
// })