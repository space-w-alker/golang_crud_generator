package generic

import (
	"reflect"

	"github.com/fatih/structs"
)

type PaginationArgs struct {
	Page  uint `json:"page" form:"page" binding:"omitempty,number,gt=1"`
	Limit uint `json:"limit" form:"limit" binding:"omitempty,number,gt=1"`
	OrderBy uint `json:"orderBy" form:"orderBy" binding:"omitempty,number,gt=1"`
	Dir uint `json:"dir" form:"dir" binding:"omitempty,number,gt=1,oneof=asc desc"`
}
type PaginationMeta struct {
	Page       uint `json:"page" form:"page" binding:"omitempty,number,gt=0"`
	Limit      uint `json:"limit" form:"limit" binding:"omitempty,number,gt=0"`
	TotalItems uint `json:"totalItems" form:"totalItems" binding:"omitempty,number,gt=0"`
}

func ToJsMap(s interface{}, out map[string]interface{}) {
	_m := structs.Map(s)
	for _, field := range structs.Fields(s) {
		v := _m[field.Name()]
		if v != nil && !reflect.ValueOf(v).IsNil() {
			out[field.Tag("json")] = _m[field.Name()]
		}
	}
}
