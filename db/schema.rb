# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_01_27_023002) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "block_numbers", force: :cascade do |t|
    t.bigint "block_number", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["block_number"], name: "index_block_numbers_on_block_number", unique: true
  end

  create_table "nft_assets", force: :cascade do |t|
    t.integer "serial_id", null: false
    t.string "image_url", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["serial_id"], name: "index_nft_assets_on_serial_id", unique: true
  end

  create_table "transactions", force: :cascade do |t|
    t.string "tx_hash", null: false
    t.bigint "block_number", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["tx_hash"], name: "index_transactions_on_tx_hash", unique: true
  end

end
