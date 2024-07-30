package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/vukovlevi/multiplayer-tic-tac-toe/views"
)

const (
    PORT = ":8080"
)

type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

func makeHTTPHandler(fn HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if err := fn(w, r); err != nil {
            slog.Error("error handling http request", "error:", err.Error())

            w.WriteHeader(http.StatusInternalServerError)
            w.Write([]byte("an error has occured"))
        }
    }
}

func render(w http.ResponseWriter, r *http.Request, component templ.Component) error {
    return component.Render(r.Context(), w)
}

func handleLogin(w http.ResponseWriter, r *http.Request) error {
    return render(w, r, views.Login())
}

func main() {
    http.HandleFunc("/", makeHTTPHandler(handleLogin))

    http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./public"))))

    slog.Info("server running", "port", PORT)
    log.Fatal(http.ListenAndServe(PORT, nil))
}
