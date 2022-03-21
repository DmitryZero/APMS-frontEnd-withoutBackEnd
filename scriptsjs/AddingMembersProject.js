var dict = {
    "BUSINESS_ADMINISTRATOR": "Администратор",
    "CURATOR": "Консультант",
    "USER": "Пользователь"
}

var notPartOfProjectYet = []; //Тут будут храниться участники, которые не состоят в этом проекте
var listOfUsersToAdd = [];
var list_newMembers = [];
var list_newCurators = [];
var roleOfUser = "";

function DeleteAlreadyMembers(project, listOfAllUsers) {
    var list = [];
    list.push(project['projectManager'], project['userCaptain']);
    project['usersConsultantsUuidList'].forEach(element => { list.push(element) });
    project['usersMembersUuidList'].forEach(element => { list.push(element) });

    for (var i = 0; i < listOfAllUsers.length; i++) {
        if (list.indexOf(listOfAllUsers[i]) == -1) notPartOfProjectYet.push(listOfAllUsers[i]);
    }
}

async function LoadAllUsers() {   
    document.querySelector('#user-list-added').innerHTML = "";
    document.querySelector('#user-list-search').innerHTML = "";   
    notPartOfProjectYet = [];     
    listOfUsersToAdd = [];

    var listOfUsers = await GetAllUsers();
    var project = await GetProject(localStorage.getItem('tokenOfProject'));
    
    if (localStorage.getItem('token') == project['userCaptain']) roleOfUser = "Captain";
    else if (localStorage.getItem('token') == project['projectManager']) roleOfUser = "Manager";

    await DeleteAlreadyMembers(project, listOfUsers);
    for (var i = 0; i < notPartOfProjectYet.length; i++) {
        var user = await GetUser(notPartOfProjectYet[i]);

        if (user['role'] == 'BUSINESS_ADMINISTRATOR') continue;
        if (user['role'] == "CURATOR" && roleOfUser == "Captain") continue;
        if (user['role'] == "USER" && roleOfUser == "Manager") continue;

        var newUser = new User(user, notPartOfProjectYet[i]);
        newUser.loadUser();
    }
}

class User {
    constructor(params, idOfUser) {
        this.firstName = params['firstName'];
        this.lastName = params['lastName'];
        this.patronymic = params['patronymic'];
        this.role = params['role'];
        this.id = idOfUser;
    }
    loadUser() {
        var divUserElement = document.createElement('div');
        divUserElement.classList.add("row", "align-items-center", "gy-2", "border-bottom");
        divUserElement.dataset.status = "new";
        divUserElement.insertAdjacentHTML('beforeend',
        '<div class="col">' +
            '<div class="avatar">' +
                '<img src="../img/avatars/priroda-zhivotnye-kotenok.jpg" alt="avatar" class="img-fluid">' +
            '</div>' +
        '</div>' +
        '<div class="col-7">' +
            '<a href="#" target="_blank" rel="noopener noreferrer">' +
                '<b>' + this.lastName + ' ' + this.firstName + ' ' + this.patronymic + '</b><br>' +
            '</a>' +
            '<small>' + dict[this.role] + '</small>' +
        '</div>' +
        '<div class="col-3">' +
            '<button id="btn_members" class="btn btn-sm btn-outline-secondary pull-right">' +
                '<i id="icon" class="bi bi-plus-lg"></i>' +
            '</button>' +
      '</div>');

        divUserElement.querySelector('#btn_members').addEventListener('click', () => {
            if (divUserElement.dataset.status == "new") {
                divUserElement.remove();
                divUserElement.dataset.status = "added";
                divUserElement.querySelector('#icon').classList = "";
                divUserElement.querySelector('#icon').classList.add("bi", "bi-x-lg");
                document.querySelector('#user-list-added').append(divUserElement);

                listOfUsersToAdd.push(this);
            }
            else if (divUserElement.dataset.status == "added") {
                divUserElement.remove();
                divUserElement.dataset.status = "new";
                divUserElement.querySelector('#icon').classList = "";
                divUserElement.querySelector('#icon').classList.add("bi", "bi-plus-lg");
                document.querySelector('#user-list-search').append(divUserElement);

                let i = listOfUsersToAdd.indexOf(this);
                listOfUsersToAdd.splice(i, 1);
            }
        });

        document.querySelector('#user-list-search').append(divUserElement);
    }
}

async function AddUsersToMembersOfProject() {
    list_newMembers = [];
    list_newCurators = [];

    listOfUsersToAdd.forEach(user => {
        if (user.role == "USER") list_newMembers.push(user);
        else if (user.role == "CURATOR") list_newCurators.push(user);
    });
    // if (roleOfUser == "Manager") await AddConsultants(list_newCurators.map((item) => { return item.id }));
    // if (roleOfUser == "Captain") await AddMembers(list_newMembers.map((item) => { return item.id }));

    listOfUsersToAdd.forEach(user => {
        AddNewParticipant(user);
    })  
}
