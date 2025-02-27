pragma solidity >=0.4.22 <0.6.0;
contract ConstantGetter {
    mapping(uint => bytes) public map;

    bytes32 public constant bytes32Constant = 0xABCDEF34ABCDEF34ABCDEF34ABCDEF34ABCDEF34ABCDEF34ABCDEF34ABCDEF34;
    bytes public constant bytesMemoryConstantA = hex"AAAdeadbeefAAAAAAdeadbeefAAAAAAdeadbeefAAAAAAdeadbeefAAAAAAdeadbeefAAAAAAdeadbeefAAAAAAdeadbeefAAA";
    bytes public constant bytesMemoryConstantB = "this should pass but the error message is much longer";
    
    constructor(bytes memory _param) public {
        map[420] = _param;
        map[0] = bytesMemoryConstantA;
        map[1] = bytesMemoryConstantB;
    }
    
    function getBytes32Constant() public pure returns(bytes32) {
        return(bytes32Constant);
    }

    function getBytesMemoryConstantA() public pure returns(bytes memory) {
        return(bytesMemoryConstantA);
    }
    
    function getBytesMemoryConstantB() public pure returns(bytes memory) {
        return(bytesMemoryConstantB);
    }
}