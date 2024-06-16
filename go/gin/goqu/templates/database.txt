package database

import (
	"database/sql"
	"fmt"

	"github.com/doug-martin/goqu/v9"
	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

var Db *sql.DB
var DB *goqu.Database

// This function will make a connection to the database only once.
func InitDB() {
	fmt.Print(viper.GetString("DATABASE_URL"))
	var err error
	connStr := viper.GetString("DATABASE_URL")
	Db, err = sql.Open("postgres", connStr)

	if err != nil {
		panic(err)
	}

	if err = Db.Ping(); err != nil {
		panic(err)
	}
	DB = goqu.New("postgres", Db)
	fmt.Println("The database is connected")
}
