build:
	@templ generate
	@go build -o main ./cmd/main.go

run: build
	@./main
