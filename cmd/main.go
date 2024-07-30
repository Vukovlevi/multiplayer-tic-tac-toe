package main

import (
	"log"
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/vukovlevi/multiplayer-tic-tac-toe/views"
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
    dir := http.Dir("./public")
    fs := http.FileServer(dir)
    http.Handle("/", fs)

    http.HandleFunc("/", makeHTTPHandler(handleLogin))

    log.Fatal(http.ListenAndServe(":8080", nil))
}
