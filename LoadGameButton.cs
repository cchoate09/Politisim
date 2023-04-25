using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class LoadGameButton : MonoBehaviour
{
    public Button mButton;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClicked);
    }

    void onButtonClicked()
    {
        int curScene = (int)Variables.Saved.Get("sceneNumber");
        SceneManager.LoadScene(curScene, LoadSceneMode.Single);
    }
}
