class CreateTransactionBlocks < ActiveRecord::Migration[6.0]
  def change
    create_table :transactions do |t|
      t.string :tx_hash, null:false
      t.bigint :block_number, null:false
      t.timestamps
    end
    
    add_index :transactions, :tx_hash, unique:true
  end
end
