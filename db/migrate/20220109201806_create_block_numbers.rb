class CreateBlockNumbers < ActiveRecord::Migration[6.0]
  def change
    create_table :block_numbers do |t|
      t.bigint :block_number, null:false
      t.timestamps
    end
    
    add_index :block_numbers, :block_number, unique:true
  end
end
