const BOOKS_KEY = "thuVienBooks";
const RECORDS_KEY = "thuVienBorrowRecords";
const SHARED_PREFIX = "THU_VIEN_DATA:";
const ROLE_KEY = "thuVienRole";

const STATUS_AVAILABLE = "Còn sách";
const STATUS_BORROWED = "Đang mượn";

const defaultBooks = [
    { title: "Dế Mèn phiêu lưu ký", author: "Tô Hoài", category: "Văn học", status: "Còn sách" },
    { title: "Lão Hạc", author: "Nam Cao", category: "Truyện ngắn", status: "Còn sách" },
    { title: "Cho tôi xin một vé đi tuổi thơ", author: "Nguyễn Nhật Ánh", category: "Văn học", status: "Còn sách" },
    { title: "Clean Code", author: "Robert C. Martin", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Lập trình Java cơ bản", author: "Nguyễn Văn A", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Đắc nhân tâm", author: "Dale Carnegie", category: "Kỹ năng sống", status: "Còn sách" },
    { title: "Nhà giả kim", author: "Paulo Coelho", category: "Tiểu thuyết", status: "Còn sách" },
    { title: "Tuổi trẻ đáng giá bao nhiêu", author: "Rosie Nguyễn", category: "Kỹ năng sống", status: "Còn sách" },
    { title: "Harry Potter và Hòn đá Phù thủy", author: "J. K. Rowling", category: "Fantasy", status: "Còn sách" },
    { title: "Tôi thấy hoa vàng trên cỏ xanh", author: "Nguyễn Nhật Ánh", category: "Văn học", status: "Còn sách" },
    { title: "Lập trình Python cơ bản", author: "Nguyễn Văn B", category: "Công nghệ thông tin", status: "Còn sách" },
    { title: "Số đỏ", author: "Vũ Trọng Phụng", category: "Văn học", status: "Còn sách" }
];

function readSharedData() {
    if (window.name.startsWith(SHARED_PREFIX)) {
        try {
            return JSON.parse(window.name.substring(SHARED_PREFIX.length));
        } catch (error) {
        }
    }
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");
    if (urlData) {
        try {
            return JSON.parse(urlData);
        } catch (error) {
        }
    }
    return null;
}

function loadBooks() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.books)) {
        return sharedData.books;
    }
    const savedBooks = localStorage.getItem(BOOKS_KEY);
    if (savedBooks) {
        try {
            return JSON.parse(savedBooks);
        } catch (error) {
        }
    }
    return defaultBooks.map(function(book) { return { ...book }; });
}

function loadBorrowRecords() {
    const sharedData = readSharedData();
    if (sharedData && Array.isArray(sharedData.records)) {
        return sharedData.records;
    }
    const savedRecords = localStorage.getItem(RECORDS_KEY);
    if (savedRecords) {
        try {
            return JSON.parse(savedRecords);
        } catch (error) {
        }
    }
    return [];
}

let books = loadBooks();
let borrowRecords = loadBorrowRecords();

function saveData() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(RECORDS_KEY, JSON.stringify(borrowRecords));
    window.name = SHARED_PREFIX + JSON.stringify({
        books: books,
        records: borrowRecords
    });
}

function checkAdmin() {
    if (sessionStorage.getItem(ROLE_KEY) !== "admin") {
        alert("Bạn cần đăng nhập bằng tài khoản admin để vào trang này.");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

const formPanel = document.getElementById("formPanel");
const bookForm = document.getElementById("bookForm");
const formTitle = document.getElementById("formTitle");
const titleInput = document.getElementById("bookTitle");
const authorInput = document.getElementById("bookAuthor");
const categoryInput = document.getElementById("bookCategory");
const categoryList = document.getElementById("categoryList");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const tableBody = document.getElementById("bookTableBody");
const totalBooks = document.getElementById("totalBooks");
const availableBooks = document.getElementById("availableBooks");
const borrowedBooks = document.getElementById("borrowedBooks");
const logoutLink = document.getElementById("logoutLink");

let editingIndex = -1;

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message " + type;
}

function validateBook(title, author, category, currentBook) {
    if (title === "" || author === "" || category === "") {
        return "Vui lòng nhập đầy đủ tên sách, tác giả và thể loại.";
    }
    if (title.length > 150) {
        return "Tên sách không được dài quá 150 ký tự.";
    }
    if (author.length > 80 || category.length > 80) {
        return "Tác giả và thể loại không được dài quá 80 ký tự.";
    }
    for (let i = 0; i < books.length; i++) {
        const sameTitle = books[i].title.toLowerCase() === title.toLowerCase();
        if (sameTitle && books[i] !== currentBook) {
            return "Sách này đã có trong thư viện.";
        }
    }
    return "";
}

function resetForm() {
    editingIndex = -1;
    bookForm.reset();
    formTitle.textContent = "Thêm sách mới";
    saveButton.textContent = "Thêm sách";
    cancelButton.hidden = true;
    formPanel.classList.remove("is-editing");
}

function renderCategoryOptions() {
    categoryList.innerHTML = "";
    const seen = [];
    for (let i = 0; i < books.length; i++) {
        const category = books[i].category;
        if (seen.indexOf(category) === -1) {
            seen.push(category);
            const option = document.createElement("option");
            option.value = category;
            categoryList.appendChild(option);
        }
    }
}

function appendTextCell(row, value, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = value;
    row.appendChild(cell);
}

function updateSummary() {
    totalBooks.textContent = books.length;
    availableBooks.textContent = books.filter(function(book) {
        return book.status === STATUS_AVAILABLE;
    }).length;
    borrowedBooks.textContent = books.filter(function(book) {
        return book.status === STATUS_BORROWED;
    }).length;
}

function renderTable() {
    const keyword = searchInput.value.toLowerCase().trim();
    const shownBooks = books.filter(function(book) {
        return book.title.toLowerCase().includes(keyword) ||
            book.author.toLowerCase().includes(keyword) ||
            book.category.toLowerCase().includes(keyword);
    });

    tableBody.innerHTML = "";
    resultCount.textContent = "Hiển thị " + shownBooks.length + " / " + books.length + " cuốn sách";

    if (shownBooks.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "empty-row";
        if (books.length === 0) {
            cell.textContent = "Chưa có sách nào. Hãy thêm sách ở biểu mẫu phía trên.";
        } else {
            cell.textContent = "Không tìm thấy sách phù hợp.";
        }
        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    for (let i = 0; i < shownBooks.length; i++) {
        const book = shownBooks[i];
        const row = document.createElement("tr");
        if (books.indexOf(book) === editingIndex) {
            row.className = "is-editing-row";
        }

        appendTextCell(row, book.title, "cell-strong");
        appendTextCell(row, book.author);
        appendTextCell(row, book.category);

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = "book-status";
        status.textContent = book.status;
        if (book.status !== STATUS_AVAILABLE) {
            status.className += " unavailable";
        }
        statusCell.appendChild(status);
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        actionCell.className = "action-cell";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-button edit-button";
        editButton.textContent = "Sửa";
        editButton.addEventListener("click", function() {
            startEdit(book);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-button delete-button";
        deleteButton.textContent = "Xóa";
        deleteButton.addEventListener("click", function() {
            deleteBook(book);
        });

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }

    updateSummary();
    renderCategoryOptions();
}

function addBook(title, author, category) {
    books.push({
        title: title,
        author: author,
        category: category,
        status: STATUS_AVAILABLE
    });
    saveData();
    resetForm();
    renderTable();
    showMessage("Đã thêm sách \"" + title + "\".", "success");
}

function updateBook(book, title, author, category) {
    const oldTitle = book.title;
    book.title = title;
    book.author = author;
    book.category = category;

    if (oldTitle !== title) {
        for (let i = 0; i < borrowRecords.length; i++) {
            if (borrowRecords[i].bookTitle === oldTitle) {
                borrowRecords[i].bookTitle = title;
            }
        }
    }

    saveData();
    resetForm();
    renderTable();
    showMessage("Đã cập nhật sách \"" + title + "\".", "success");
}

function startEdit(book) {
    editingIndex = books.indexOf(book);
    titleInput.value = book.title;
    authorInput.value = book.author;
    categoryInput.value = book.category;
    formTitle.textContent = "Sửa thông tin sách";
    saveButton.textContent = "Lưu thay đổi";
    cancelButton.hidden = false;
    formPanel.classList.add("is-editing");
    showMessage("", "");
    renderTable();
    bookForm.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInput.focus();
}

function deleteBook(book) {
    if (book.status === STATUS_BORROWED) {
        showMessage("Không thể xóa \"" + book.title + "\" vì sách đang được mượn. Hãy xác nhận trả sách trước.", "error");
        return;
    }
    if (!confirm("Bạn có chắc muốn xóa sách \"" + book.title + "\" không?")) {
        return;
    }
    const index = books.indexOf(book);
    books.splice(index, 1);
    saveData();
    resetForm();
    renderTable();
    showMessage("Đã xóa sách \"" + book.title + "\".", "success");
}

bookForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const category = categoryInput.value.trim();

    const currentBook = editingIndex === -1 ? null : books[editingIndex];
    const error = validateBook(title, author, category, currentBook);
    if (error !== "") {
        showMessage(error, "error");
        return;
    }

    if (editingIndex === -1) {
        addBook(title, author, category);
    } else {
        updateBook(currentBook, title, author, category);
    }
});

cancelButton.addEventListener("click", function() {
    resetForm();
    renderTable();
    showMessage("", "");
});

searchInput.addEventListener("input", renderTable);

logoutLink.addEventListener("click", function() {
    sessionStorage.removeItem(ROLE_KEY);
});

if (checkAdmin()) {
    saveData();
    renderTable();
}
