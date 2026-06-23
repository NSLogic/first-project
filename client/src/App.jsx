import React, { useState, useEffect } from "react";
import Register from "./Register";
import Login from "./Login";
import AIHelper from "./AIHelper";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [recipes, setRecipes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [theme, setTheme] = useState("light");
  const [showProfile, setShowProfile] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [newRecipe, setNewRecipe] = useState({
    title: "",
    ingredients: "",
    instructions: "",
    prepTime: "",
    price: "",
    imageUrl: "",
    category: "South Indian",
  });
  const [editingId, setEditingId] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCart, setShowCart] = useState(false);
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert("Failed to load Razorpay.");

    const response = await fetch("https://tastytreats.onrender.com/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: calculateTotal() }),
    });
    const order = await response.json();

    const options = {
      key: "rzp_test_T51LAb6OzSEg1v", 
      amount: order.amount,
      currency: "INR",
      name: "TastyTreats",
      description: "Order Payment",
      order_id: order.id,
      handler: async (response) => {
        alert("Payment Successful! Order ID: " + response.razorpay_payment_id);
        setCart([]);
        setShowCart(false);
      },
      theme: { color: "#6200ea" },
    };
    const razor = new window.Razorpay(options);
    razor.open();
  };
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    fetch("https://tastytreats.onrender.com/api/recipes")
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch((err) => console.error("Error fetching data:", err));
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetch(`https://tastytreats.onrender.com/api/user-bookmarks/${userId}`)
        .then((res) => res.json())
        .then((data) => setUserBookmarks(data.bookmarks))
        .catch((err) => console.error("Error fetching bookmarks:", err));
    }
  }, []);

  const addRecipe = (e) => {
    e.preventDefault();
    fetch("https://tastytreats.onrender.com/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe),
    })
      .then((res) => res.json())
      .then((data) => {
        setRecipes([...recipes, data]);
        setNewRecipe({
          title: "",
          ingredients: "",
          instructions: "",
          prepTime: "",
          price: "",
          imageUrl: "",
          category: "South Indian",
        });
      });
  };

  const deleteRecipe = (id) => {
    fetch(`https://tastytreats.onrender.com/api/recipes/${id}`, {
      method: "DELETE",
    }).then(() => setRecipes(recipes.filter((recipe) => recipe._id !== id)));
  };
  const startEdit = (recipe) => {
    setEditingId(recipe._id);
    setNewRecipe(recipe);
    window.scrollTo(0, 0);
  };

  const handleSaveRecipe = (e) => {
    e.preventDefault();

    if (editingId) {
      fetch(`https://tastytreats.onrender.com/api/recipes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe),
      })
        .then((res) => res.json())
        .then((data) => {
          setRecipes(recipes.map((r) => (r._id === editingId ? data : r)));
          setEditingId(null);
          setNewRecipe({
            title: "",
            ingredients: "",
            instructions: "",
            prepTime: "",
            price: "",
            imageUrl: "",
            category: "South Indian",
          });
        });
    } else {
      addRecipe(e);
    }
  };
  const addToCart = (recipe) => {
    setCart([...cart, recipe]);
  };

  const removeFromCart = (recipe) => {
    const index = cart.findIndex((item) => item._id === recipe._id);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };
  const toggleBookmark = async (recipeId) => {
    const userId = localStorage.getItem("userId");
    console.log("Attempting to bookmark with:", { userId, recipeId });

    try {
      const response = await fetch(
        "https://tastytreats.onrender.com/api/bookmark",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, recipeId }),
        },
      );

      console.log("Response Status:", response.status);
      const data = await response.json();
      console.log("Actual Server Data:", data);

      if (response.ok) {
        setUserBookmarks(data.bookmarks);
      } else {
        console.error("Server responded with error:", data);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price || 0), 0);
  };
  const getItemCount = (id) => {
    return cart.filter((item) => item._id === id).length;
  };
  return (
    <div className={isLoggedIn ? "app-layout" : "login-page"}>
      {!isLoggedIn ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "50px",
          }}
        >
          <h1>Welcome to TastyTreats</h1>
          <Login setIsLoggedIn={setIsLoggedIn} />
          <Register />
        </div>
      ) : (
        <>
          <div className="button-container">
            {localStorage.getItem("email") === "govinda@gmail.com" && (
              <button
                className="admin-toggle"
                onClick={() => setIsAdmin(!isAdmin)}
              >
                {isAdmin ? "Switch to Customer View" : "Manage Menu"}
              </button>
            )}
            <button onClick={() => setShowCart(!showCart)}>
              🛒 {cart.length} items | ₹{calculateTotal()}
            </button>

            <button onClick={toggleTheme}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                setIsLoggedIn(false);
              }}
            >
              Logout
            </button>
          </div>
          <div className="profile-wrapper">
            <div
              className="user-avatar"
              onClick={() => setShowProfile(!showProfile)}
            >
              {localStorage.getItem("username")?.charAt(0).toUpperCase() || "U"}
            </div>
            {showProfile && (
              <div className="profile-dropdown">
                <strong>
                  {localStorage.getItem("username") || "Guest User"}
                </strong>
                <br />
                <small>{localStorage.getItem("email") || "No email"}</small>
              </div>
            )}
          </div>
          {showCart && (
            <div className="cart-modal">
              <h3>Your Order</h3>
              <ul>
                {Array.from(new Set(cart.map((item) => item._id))).map((id) => {
                  const item = cart.find((i) => i._id === id);
                  const count = getItemCount(id);
                  return (
                    <li key={id}>
                      {item.title} x {count} - ₹{parseFloat(item.price) * count}
                    </li>
                  );
                })}
              </ul>
              <p>
                <strong>Total: ₹{calculateTotal()}</strong>
              </p>
             <button onClick={handlePayment} style={{ background: "#6200ea", color: "white", padding: "10px", width: "100%", border: "none", cursor: "pointer" }}>
  Pay Now (₹{calculateTotal()})
</button>
              <button onClick={() => setShowCart(false)}>Close</button>
            </div>
          )}
          <aside className="sidebar">
            <h3>Categories</h3>
            <ul>
              <li onClick={() => setSelectedCategory("All")}>All</li>
              <li onClick={() => setSelectedCategory("South Indian")}>
                South Indian
              </li>
              <li onClick={() => setSelectedCategory("North Indian")}>
                North Indian
              </li>
              <li onClick={() => setSelectedCategory("Chinese")}>Chinese</li>
              <li onClick={() => setSelectedCategory("Desserts")}>Desserts</li>
            </ul>
          </aside>

          <main className="menu-content">
            <h1>TastyTreats</h1>
            {isAdmin && <AIHelper />}
            {isAdmin && (
              <form onSubmit={handleSaveRecipe} className="recipe-form">
                <h3>{editingId ? "Edit Recipe" : "Add New Recipe"}</h3>
                <input
                  placeholder="Title"
                  value={newRecipe.title}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, title: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Price"
                  value={newRecipe.price}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, price: e.target.value })
                  }
                />
                <input
                  placeholder="Prep Time"
                  value={newRecipe.prepTime}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, prepTime: e.target.value })
                  }
                />
                <input
                  placeholder="Image URL"
                  value={newRecipe.imageUrl}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, imageUrl: e.target.value })
                  }
                />
                <input
                  placeholder="Ingredients"
                  value={newRecipe.ingredients}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, ingredients: e.target.value })
                  }
                  style={{ gridColumn: "span 2" }}
                />
                <input
                  placeholder="Instructions"
                  value={newRecipe.instructions}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, instructions: e.target.value })
                  }
                  style={{ gridColumn: "span 2" }}
                />
                <button type="submit">
                  {editingId ? "Update Recipe" : "Add Recipe"}
                </button>
                {editingId && (
                  <button type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                )}
              </form>
            )}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="recipe-grid">
              {recipes
                .filter(
                  (recipe) =>
                    selectedCategory === "All" ||
                    recipe.category === selectedCategory,
                )
                .filter((recipe) =>
                  recipe.title.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((recipe) => (
                  <div key={recipe._id} className="recipe-card">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="recipe-img"
                    />
                    <h3>{recipe.title}</h3>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(recipe._id)}
                      style={{
                        background:
                          userBookmarks && userBookmarks.includes(recipe._id)
                            ? "gold"
                            : "lightgray",
                      }}
                    >
                      {userBookmarks && userBookmarks.includes(recipe._id)
                        ? "★ Bookmarked"
                        : "☆ Bookmark"}
                    </button>
                    <p>{recipe.ingredients}</p>
                    <p>
                      {recipe.prepTime} mins | ₹{recipe.price}
                      {getItemCount(recipe._id) > 0 && (
                        <span style={{ fontWeight: "bold", color: "#6200ea" }}>
                          {" | Total: ₹" +
                            getItemCount(recipe._id) *
                              parseFloat(recipe.price || 0)}
                        </span>
                      )}
                    </p>
                    <div className="cart-controls">
                      {getItemCount(recipe._id) === 0 ? (
                        <button
                          className="add-btn"
                          onClick={() => addToCart(recipe)}
                        >
                          Add
                        </button>
                      ) : (
                        <div className="counter-controls">
                          <button onClick={() => removeFromCart(recipe)}>
                            -
                          </button>
                          <span className="count-display">
                            {getItemCount(recipe._id)}
                          </span>
                          <button onClick={() => addToCart(recipe)}>+</button>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          gap: "5px",
                          justifyContent: "center",
                        }}
                      >
                        <button onClick={() => startEdit(recipe)}>Edit</button>
                        <button onClick={() => deleteRecipe(recipe._id)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
export default App;
