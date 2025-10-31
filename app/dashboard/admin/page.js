"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, BookOpen, X, Search, Edit, Library, Tag, Book, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import CreatableSelect from "react-select/creatable"
import SaleDialog from "@/components/sales/SaleControl";
import StaffDialog from "@/components/sales/AddStaff";

export default function AdminDashboard() {
  const [isCreatingBook, setIsCreatingBook] = useState(false)
  const [bookDetails, setBookDetails] = useState({
    title: "",
    authorIds: [],
    genreIds: [],
    coverImage: "",
    year: "",
    price: "",
    stock: "",
    description: "",
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
    isStaffPick: false,
    isEbook: false,
    isOnSale: false,
    salePercentage: 0,
    salePrice: "",
  });


  const [authors, setAuthors] = useState([]);
  const [books, setBooks] = useState([])
  const [genres, setGenres] = useState([])
  const [newGenre, setNewGenre] = useState("")
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isCreatingGenre, setIsCreatingGenre] = useState(false)
  const [editBookId, setEditBookId] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isSaleDialogOpen, setSaleDialogOpen] = useState(false);
  const [isStaffDialogOpen, setStaffDialogOpen] = useState(false);
  const [isOrderDialogOpen, setOrderDialogOpen] = useState(false);

const router = useRouter();

  const goToOrders = () => {
    router.push('/dashboard/admin/orders');
  };


 
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get("/api/books")
        setBooks(response.data)
      } catch (error) {
        console.error("Failed to fetch books:", error)
      }
    }

    const fetchGenres = async () => {
      try {
        const response = await axios.get("/api/genres")
        setGenres(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error("Failed to fetch genres:", error)
        setGenres([])
      }
    }

    const fetchAuthors = async () => {
      try {
        const response = await axios.get("/api/authors");
        setAuthors(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch authors:", error);
        setAuthors([]);
      }
    };

    fetchBooks()
    fetchGenres()
    fetchAuthors()
  }, [])

  const resetForm = () => {
    setBookDetails({
      title: "",
      authorIds: [],
      genreIds: [],
      coverImage: "",
      year: "",
      price: "",
      stock: "",
      description: "",
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      isStaffPick: false,
      isEbook: false,
      isOnSale: false,
      salePercentage: 0,
      salePrice: "",
    });
    setFiles([]);
  };

  const toggleCreateBookForm = () => {
    setIsCreatingBook(!isCreatingBook)
    if (isCreatingBook) {
      resetForm()
      setIsEdit(false)
      setEditBookId(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setBookDetails((prevDetails) => ({
      ...prevDetails,
      [name]: checked,
    }));
  };

  const handleAuthorOrGenreChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setBookDetails((prevDetails) => ({
      ...prevDetails,
      [name]: selectedValues,
    }));
  };

  const handleInputFile = (e) => {
    const files = e.target.files
    const newFiles = [...files].filter((file) => file.size < 1024 * 1024 && file.type.startsWith("image/"))
    setFiles(newFiles)
  }

  const handleEditBook = (book) => {
    setEditBookId(book._id)
    setBookDetails({
      title: book.title || "",
      authorIds: book.authors ? book.authors.map(author => author._id) : [],
      genreIds: book.genres ? book.genres.map(genre => genre._id) : [],
      coverImage: book.coverImage || "",
      year: book.year || "",
      price: book.price !== undefined ? String(book.price) : "",
      stock: book.stock !== undefined ? String(book.stock) : "",
      description: book.description || "",
      isFeatured: book.isFeatured || false,
      isBestseller: book.isBestseller || false,
      isNewArrival: book.isNewArrival || false,
      isStaffPick: book.isStaffPick || false,
      stock: book.stock || "",

    })
    setIsEdit(true)
    setIsCreatingBook(true)
  }

  const handleDeleteBook = async (bookId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this book?")
    if (!isConfirmed) return
    try {
      await axios.delete(`/api/books/${bookId}`)
      setBooks(books.filter((book) => book._id !== bookId))
    } catch (error) {
      console.error("Error deleting book:", error)
      setError("Failed to delete the book.")
    }
  }

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedImage = bookDetails.coverImage;
      if (files.length > 0) {
        uploadedImage = await uploadPhoto(files[0]);
      }
      const dataToSend = {
        ...bookDetails,
        price: parseFloat(bookDetails.price),
      };
      if (!uploadedImage && !isEdit) {
        delete dataToSend.coverImage;
      } else {
        dataToSend.coverImage = uploadedImage;
      }
      if (editBookId) {
        await axios.put(`/api/books/${editBookId}`, dataToSend);
      } else {
        await axios.post("/api/books", dataToSend);
      }
      const response = await axios.get("/api/books");
      setBooks(response.data);
      setIsCreatingBook(false);
      setIsEdit(false);
      setEditBookId(null);
      resetForm();
    } catch (error) {
      console.error("Error submitting book:", error.response ? error.response.data : error);
      let errorMessage = "Failed to submit the book. Please check all fields and try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPhoto = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await axios.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.filename
  }

  // Handler for when a new author is created via CreatableSelect
  const handleCreateAuthor = async (inputValue) => {
    try {
      const res = await axios.post("/api/authors", { name: inputValue });
      const newAuthor = res.data;
      setAuthors(prev => [...prev, newAuthor]);
      setBookDetails(prev => ({
        ...prev,
        authorIds: [...prev.authorIds, newAuthor._id],
      }));
    } catch (err) {
      setError("Failed to create author.");
    }
  };

  // Handler for when a new genre is created via CreatableSelect
  const handleCreateGenreOption = async (inputValue) => {
    try {
      const res = await axios.post("/api/genres", { name: inputValue });
      const newGenre = res.data;
      setGenres(prev => [...prev, newGenre]);
      setBookDetails(prev => ({
        ...prev,
        genreIds: [...prev.genreIds, newGenre._id],
      }));
    } catch (err) {
      setError("Failed to create genre.");
    }
  };

  // Helper functions for react-select options
  const authorOptions = authors.map(a => ({ value: a._id, label: a.name }));
  const genreOptions = genres.map(g => ({ value: g._id, label: g.name }));
  const selectedAuthorOptions = authorOptions.filter(opt => bookDetails.authorIds.includes(opt.value));
  const selectedGenreOptions = genreOptions.filter(opt => bookDetails.genreIds.includes(opt.value));

  // Handler for authors
  const handleAuthorsChange = async (selected) => {
    const newAuthors = selected.filter(opt => !opt.value);
    let updatedAuthors = [...authors];
    let selectedIds = [];
    for (const newAuthor of newAuthors) {
      const res = await axios.post("/api/authors", { name: newAuthor.label });
      updatedAuthors.push(res.data);
      setAuthors(updatedAuthors);
      selectedIds.push(res.data._id);
    }
    selected.forEach(opt => {
      if (opt.value) selectedIds.push(opt.value);
    });
    setBookDetails(prev => ({
      ...prev,
      authorIds: selectedIds,
    }));
  };

  // Handler for genres
  const handleGenresChange = async (selected) => {
    const newGenres = selected.filter(opt => !opt.value && opt.label && opt.label.trim());
    let updatedGenres = [...genres];
    let selectedIds = [];
    for (const newGenre of newGenres) {
      try {
        const res = await axios.post("/api/genres", { name: newGenre.label });
        updatedGenres.push(res.data);
        setGenres(updatedGenres); // update genres state immediately
        selectedIds.push(res.data._id);
      } catch (err) {
        setError("Failed to create genre.");
      }
    }
    selected.forEach(opt => {
      if (opt.value) selectedIds.push(opt.value);
    });
    setBookDetails(prev => ({
      ...prev,
      genreIds: selectedIds,
    }));
  };

  // Filter books based on search term and active tab
  const filteredBooks = books.filter((book) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(searchTermLower) ||
      (book.authors && book.authors.some((author) =>
        author.name.toLowerCase().includes(searchTermLower)
      ));
    if (activeTab === "all") return matchesSearch
    return (
      matchesSearch &&
      book.genres &&
      book.genres.some((g) => g.name.toLowerCase() === activeTab.toLowerCase())
    );
  })

  // When getting unique genres for tabs
  const uniqueGenres = Array.isArray(genres) ? [...new Set(genres.map((genre) => genre.name))] : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-bookscape-bg to-amber-50/30 text-bookscape-text font-serif">
      {/* Simple elegant header */}
      <div className="bg-bookscape-dark text-white border-b border-bookscape-gold/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Library className="h-6 w-6 text-bookscape-gold" />
              <h1 className="text-2xl font-serif font-bold text-white">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleCreateBookForm}
                className="flex items-center gap-2 px-4 py-2 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-amber-400 transition-colors font-medium"
              >
                {isCreatingBook ? (
                  <>
                    <Library className="h-4 w-4" />
                    View Books
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Book
                  </>
                )}
              </button>
              <button
                onClick={() => setSaleDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker transition-colors font-medium"
              >
                <Tag className="h-4 w-4" />
                Apply Sale to All Books
              </button>

              <button
                onClick={() => setStaffDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Staff
              </button>
              <StaffDialog
                open={isStaffDialogOpen}
                onClose={() => setStaffDialogOpen(false)}
              />
              <button
                onClick={goToOrders}
                className="flex items-center gap-2 px-4 py-2 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-amber-400 transition-colors font-medium"
              >
                Go to Orders Page
              </button>



            </div>
          </div>
        </div>

        <SaleDialog
          open={isSaleDialogOpen}
          onClose={() => setSaleDialogOpen(false)}
        />



      </div>



      <main className="container mx-auto px-6 py-8">
        {isCreatingBook ? (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-amber-100">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-100">
              <h2 className="text-2xl font-serif font-semibold text-bookscape-dark">
                {editBookId ? "Edit Book" : "Add New Book"}
              </h2>
              <button
                onClick={toggleCreateBookForm}
                className="text-gray-400 hover:text-bookscape-dark transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-start">
                <X className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                  <input
                    type="text"
                    name="title"
                    value={bookDetails.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
                  <CreatableSelect
                    isMulti
                    options={authorOptions}
                    value={selectedAuthorOptions}
                    onChange={handleAuthorsChange}
                    onCreateOption={handleCreateAuthor}
                    placeholder="Select or type authors"
                    className="mb-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genres</label>
                  <CreatableSelect
                    isMulti
                    options={genreOptions}
                    value={selectedGenreOptions}
                    onChange={handleGenresChange}
                    onCreateOption={handleCreateGenreOption}
                    placeholder="Select or type genres"
                    className="mb-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
                  <input
                    type="text"
                    name="year"
                    value={bookDetails.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={bookDetails.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={bookDetails.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                    required
                  />
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="coverImage"
                        onChange={handleInputFile}
                        className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                      />
                      <p className="mt-1 text-xs text-gray-500">Max file size: 1MB. Supported formats: JPG, PNG, GIF</p>
                    </div>
                    <div className="w-24 h-32 bg-amber-50 rounded-md overflow-hidden flex items-center justify-center border border-amber-200 shadow-sm">
                      {files.length > 0 ? (
                        <img
                          src={URL.createObjectURL(files[0]) || "/placeholder.svg"}
                          alt="Book Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : bookDetails.coverImage ? (
                        <img
                          src={`/bookCovers/${bookDetails.coverImage}`}
                          alt="Book Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-10 h-10 text-amber-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={bookDetails.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-md text-sm focus:ring-2 focus:ring-bookscape-gold focus:border-transparent transition-all"
                  placeholder="Write a short summary or description"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Status</label>
                <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                  {[
                    { name: "isFeatured", label: "Featured" },
                    { name: "isBestseller", label: "Bestseller" },
                    { name: "isNewArrival", label: "New Arrival" },
                    { name: "isStaffPick", label: "Staff Pick" },
                    { name: "isEbook", label: "Ebook" }, // <-- EBOOK FLAG
                  ].map((flag) => (
                    <div key={flag.name} className="flex items-center">
                      <input
                        id={flag.name}
                        name={flag.name}
                        type="checkbox"
                        checked={bookDetails[flag.name]}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-bookscape-gold border-gray-300 rounded focus:ring-bookscape-gold"
                      />
                      <label htmlFor={flag.name} className="ml-2 block text-sm text-gray-900">
                        {flag.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-amber-100">
                <button
                  type="button"
                  onClick={toggleCreateBookForm}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:ring-offset-2 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      {isEdit ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isEdit ? "Update Book" : "Add Book"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Elegant search and filter section */}
            <div className="bg-white rounded-xl shadow-md border border-amber-100 mb-8 overflow-hidden">
              <div className="p-6 border-b border-amber-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-lg font-medium text-bookscape-dark">Book Collection</h2>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Always visible genre filters */}
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/30">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "all"
                      ? "bg-bookscape-gold text-bookscape-dark shadow-md"
                      : "bg-white text-gray-700 hover:bg-amber-50 border border-amber-200"
                      }`}
                  >
                    All Books
                  </button>
                  {uniqueGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setActiveTab(genre)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === genre
                        ? "bg-bookscape-gold text-bookscape-dark shadow-md"
                        : "bg-white text-gray-700 hover:bg-amber-50 border border-amber-200"
                        }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                  <span>Showing</span>
                  <span className="font-medium text-bookscape-dark">{filteredBooks.length}</span>
                  <span>of</span>
                  <span className="font-medium text-bookscape-dark">{books.length}</span>
                  <span>books</span>
                </div>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-amber-100 p-8 text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-200">
                    <BookOpen className="h-10 w-10 text-amber-300" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium text-bookscape-dark mb-3">Your library awaits</h3>
                  <p className="text-gray-500 max-w-md mb-8">
                    {searchTerm
                      ? `No books match your search for "${searchTerm}"`
                      : "There are no books in this category yet. Add your first book to begin building your collection."}
                  </p>
                  <button
                    onClick={toggleCreateBookForm}
                    className="flex items-center gap-2 px-6 py-3 bg-bookscape-dark text-white rounded-md hover:bg-bookscape-darker focus:outline-none focus:ring-2 focus:ring-bookscape-gold focus:ring-offset-2 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Book
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBooks.map((book) => (
                  <div
                    key={book._id}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-amber-100 flex flex-col transform hover:-translate-y-1 duration-200"
                  >
                    <div
                      className="relative h-64 overflow-hidden bg-amber-50 cursor-pointer"
                      onClick={() => handleEditBook(book)}
                    >
                      {book.coverImage ? (
                        <img
                          src={`/bookCovers/${book.coverImage}`}
                          alt={`${book.title} Cover`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book className="h-16 w-16 text-amber-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-serif font-semibold line-clamp-1 text-bookscape-dark">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{book.authors.map(a => a.name).join(", ")}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {book.genreIds && book.genreIds.length > 0 ? (
                          book.genreIds.map((id, idx) => {
                            const genreObj = genres.find((g) => g._id === id);
                            const genreName = genreObj?.name || "Unknown";
                            // Use both id and genreName for uniqueness fallback
                            return (
                              <span key={`${id || "unknown"}-${genreName}-${idx}`} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                {genreName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">No Genre</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-amber-100">
                        <div className="flex items-center gap-2">
                          {book.salePrice && book.salePrice < book.price ? (
                            <>
                              <p className="text-xs text-gray-500 line-through">${book.price}</p>
                              <p className="text-sm font-bold text-bookscape-dark">${book.salePrice}</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-bookscape-dark">${book.price}</p>
                          )}
                        </div>


                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {book.year}
                        </p>
                      </div>


                      {/* Always visible action buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBook(book)
                          }}
                          className="flex-1 py-1.5 px-2 bg-amber-100 text-bookscape-dark text-sm font-medium rounded-md hover:bg-amber-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBook(book._id)
                          }}
                          className="flex-1 py-1.5 px-2 bg-bookscape-dark text-white text-sm font-medium rounded-md hover:bg-bookscape-darker transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
