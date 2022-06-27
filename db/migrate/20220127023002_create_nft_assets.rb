class CreateNftAssets < ActiveRecord::Migration[6.0]
  def change
    create_table :nft_assets do |t|
      t.integer :serial_id, null: false
      t.string :image_url, null: false
      t.timestamps
    end

    add_index :nft_assets, :serial_id, unique: true
  end
end
